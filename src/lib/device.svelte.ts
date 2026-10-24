import { findDevice } from './devices';
import { getInfo, withShift, type Command, type Shift } from './protocol/commands';
import { encodeCommand } from './protocol/framing';
import { load, save } from './storage';
import { BleTransport } from './transport/ble';
import { DemoTransport } from './transport/demo';
import { SerialTransport, grantedSerialPorts, isSerialSupported, requestSerialPort } from './transport/serial';
import type { Transport, TransportKind } from './transport/types';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export interface LogEntry {
  id: number;
  dir: 'tx' | 'rx' | 'info' | 'error';
  text: string;
  time: number;
}

/** Pause between commands so the firmware never sees two commands in one USB packet. */
const COMMAND_GAP_MS = 30;
const MODEL_RETRY_MS = 1500;
const BATTERY_POLL_MS = 60_000;
const LOG_LIMIT = 300;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let logId = 1;

class DeviceStore {
  status = $state<ConnectionStatus>('disconnected');
  kind = $state<TransportKind | null>(null);
  battery = $state<number | null>(null);
  mac = $state('');
  firmware = $state('');
  model = $state('');
  shift = $state<Shift>(load<Shift>('hly:shift', 'R'));
  demo = $state(false);
  log = $state<LogEntry[]>([]);

  device = $derived(findDevice(this.model));
  /** Connected and the model is one we know how to configure. */
  ready = $derived(this.status === 'connected' && this.device !== null);
  /** Connected, but the device reported a model this app does not know. */
  unsupported = $derived(this.status === 'connected' && this.model !== '' && this.device === null);

  private transport: Transport | null = null;
  private queue: Promise<void> = Promise.resolve();
  private modelRetry: ReturnType<typeof setTimeout> | null = null;
  private batteryTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (isSerialSupported()) {
      // Re-attach automatically when a previously granted device is plugged in.
      navigator.serial.addEventListener('connect', () => {
        if (this.status === 'disconnected') void this.autoConnect();
      });
    }
  }

  setShift(shift: Shift) {
    this.shift = shift;
    save('hly:shift', shift);
  }

  /** Try a port the user granted earlier, without showing a picker. */
  async autoConnect(): Promise<boolean> {
    const [port] = await grantedSerialPorts();
    if (!port || this.status !== 'disconnected') return false;
    try {
      await this.attach(() => SerialTransport.open(port, this.events));
      return true;
    } catch (err) {
      this.addLog('error', `Auto-connect failed: ${errorMessage(err)}`);
      this.status = 'disconnected';
      return false;
    }
  }

  async connectUsb() {
    const port = await requestSerialPort(); // throws NotFoundError if the user cancels
    await this.attach(() => SerialTransport.open(port, this.events));
  }

  async connectBle() {
    await this.attach(() => BleTransport.request(this.events));
  }

  /** Simulated device for trying the UI without hardware. */
  async connectDemo(model: string) {
    this.demo = true;
    await this.attach(async () => new DemoTransport(model, this.events));
  }

  async disconnect() {
    const transport = this.transport;
    this.reset();
    this.addLog('info', 'Disconnected');
    await transport?.close();
  }

  /** Queue a command. Models with a slide switch get its position attached. */
  send(cmd: Command): Promise<void> {
    const final = withShift(cmd, this.device?.hasShift ? this.shift : null);
    const run = async () => {
      const transport = this.transport;
      if (!transport) throw new Error('Not connected');
      const text = JSON.stringify(final);
      this.addLog('tx', text);
      await transport.write(encodeCommand(final));
      await sleep(COMMAND_GAP_MS);
    };
    const result = this.queue.then(run);
    this.queue = result.catch(() => {});
    return result;
  }

  async sendAll(cmds: Command[]) {
    for (const cmd of cmds) await this.send(cmd);
  }

  requestInfo() {
    for (const topic of ['battery', 'mac', 'firmware', 'model'] as const) void this.send(getInfo(topic)).catch(() => {});
  }

  clearLog() {
    this.log = [];
  }

  private events = {
    onMessage: (msg: unknown) => this.handleMessage(msg),
    onDisconnect: () => {
      this.addLog('info', 'Device disconnected');
      this.reset();
    },
  };

  private async attach(open: () => Promise<Transport>) {
    if (this.transport) await this.disconnect();
    this.status = 'connecting';
    try {
      this.transport = await open();
    } catch (err) {
      this.status = 'disconnected';
      throw err;
    }
    this.kind = this.transport.kind;
    this.status = 'connected';
    this.addLog('info', `Connected over ${this.kind === 'usb' ? 'USB' : 'Bluetooth'}`);
    this.requestInfo();
    // The model reply is what unlocks the UI; ask again if it got lost.
    this.modelRetry = setTimeout(() => {
      if (this.status === 'connected' && !this.model) {
        void this.send(getInfo('model')).catch(() => {});
        void this.send(getInfo('battery')).catch(() => {});
      }
    }, MODEL_RETRY_MS);
    this.batteryTimer = setInterval(() => void this.send(getInfo('battery')).catch(() => {}), BATTERY_POLL_MS);
  }

  private handleMessage(msg: unknown) {
    this.addLog('rx', JSON.stringify(msg));
    if (!msg || typeof msg !== 'object') return;
    const { o, t, v } = msg as { o?: string; t?: string; v?: unknown };
    if (o !== 'getresult') return;
    const value = String(v ?? '');
    switch (t) {
      case 'battery': {
        const n = parseInt(value, 10);
        this.battery = Number.isFinite(n) ? n : null;
        break;
      }
      case 'mac':
        this.mac = value.replaceAll('-', '');
        break;
      case 'firmware':
        this.firmware = value;
        break;
      case 'model':
        this.model = value;
        break;
    }
  }

  private reset() {
    if (this.modelRetry) clearTimeout(this.modelRetry);
    if (this.batteryTimer) clearInterval(this.batteryTimer);
    this.modelRetry = null;
    this.batteryTimer = null;
    this.transport = null;
    this.queue = Promise.resolve();
    this.status = 'disconnected';
    this.kind = null;
    this.demo = false;
    this.battery = null;
    this.mac = '';
    this.firmware = '';
    this.model = '';
  }

  addLog(dir: LogEntry['dir'], text: string) {
    this.log.push({ id: logId++, dir, text, time: Date.now() });
    if (this.log.length > LOG_LIMIT) this.log.splice(0, this.log.length - LOG_LIMIT);
  }
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** True when the user dismissed a browser device picker. */
export function isPickerCancel(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'NotFoundError';
}

export const device = new DeviceStore();
