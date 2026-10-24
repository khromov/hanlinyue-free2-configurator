import { JsonStreamParser, SequenceCounter, USB_SEGMENT_LIMIT, segment } from '../protocol/framing';
import { BAUD_RATE, USB_FILTER, type Transport, type TransportEvents } from './types';

/** Pause between the segments of one command (see `write`). */
const SEGMENT_GAP_MS = 15;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const isSerialSupported = () => typeof navigator !== 'undefined' && 'serial' in navigator;

export async function requestSerialPort(): Promise<SerialPort> {
  return navigator.serial.requestPort({ filters: [USB_FILTER] });
}

/** Ports the user already granted on a previous visit. */
export async function grantedSerialPorts(): Promise<SerialPort[]> {
  if (!isSerialSupported()) return [];
  const ports = await navigator.serial.getPorts();
  return ports.filter((p) => {
    const info = p.getInfo();
    return info.usbVendorId === USB_FILTER.usbVendorId && info.usbProductId === USB_FILTER.usbProductId;
  });
}

export class SerialTransport implements Transport {
  readonly kind = 'usb' as const;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private seq = new SequenceCounter();
  private parser = new JsonStreamParser();
  private closing = false;
  private readLoopDone: Promise<void> = Promise.resolve();

  private constructor(
    readonly port: SerialPort,
    private events: TransportEvents,
  ) {}

  static async open(port: SerialPort, events: TransportEvents): Promise<SerialTransport> {
    const transport = new SerialTransport(port, events);
    // A port left open by a crashed tab or HMR reload throws InvalidStateError.
    try {
      await port.open({ baudRate: BAUD_RATE });
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'InvalidStateError')) throw err;
    }
    transport.readLoopDone = transport.readLoop();
    return transport;
  }

  private async readLoop() {
    const decoder = new TextDecoder();
    while (this.port.readable && !this.closing) {
      this.reader = this.port.readable.getReader();
      try {
        for (;;) {
          const { value, done } = await this.reader.read();
          if (done) break;
          if (value) {
            for (const msg of this.parser.push(decoder.decode(value, { stream: true }))) this.events.onMessage(msg);
          }
        }
      } catch {
        // Device unplugged (NetworkError) or a framing error: fall through.
        break;
      } finally {
        this.reader.releaseLock();
        this.reader = null;
      }
    }
    if (!this.closing) this.events.onDisconnect();
  }

  async write(data: Uint8Array) {
    const writable = this.port.writable;
    if (!writable) throw new Error('Serial port is not writable');
    const writer = writable.getWriter();
    try {
      const segments = segment(data, USB_SEGMENT_LIMIT, this.seq.next());
      for (const [i, seg] of segments.entries()) {
        await writer.write(seg);
        // The firmware treats each USB packet as one segment. Web Serial has no
        // drain(), so back-to-back writes can be merged into one transfer and
        // split across packet boundaries. Pace them so each goes out alone.
        if (i < segments.length - 1) await sleep(SEGMENT_GAP_MS);
      }
    } finally {
      writer.releaseLock();
    }
  }

  async close() {
    this.closing = true;
    try {
      await this.reader?.cancel();
    } catch {
      /* already gone */
    }
    await this.readLoopDone;
    try {
      await this.port.close();
    } catch {
      /* already closed or unplugged */
    }
  }
}
