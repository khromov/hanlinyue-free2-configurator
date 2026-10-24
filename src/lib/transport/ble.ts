import { BLE_SEGMENT_LIMIT, JsonStreamParser, SequenceCounter, segment } from '../protocol/framing';
import { BLE_NOTIFY_CHAR, BLE_SERVICE, BLE_WRITE_CHAR, type Transport, type TransportEvents } from './types';

export const isBluetoothSupported = () => typeof navigator !== 'undefined' && 'bluetooth' in navigator;

/**
 * Experimental: the official desktop app ships a BLE manager for the same
 * JSON protocol over Jieli's AE30 service. It is not wired up in their UI,
 * so firmware support may vary by model.
 */
export class BleTransport implements Transport {
  readonly kind = 'ble' as const;
  private seq = new SequenceCounter();
  private parser = new JsonStreamParser();
  private decoder = new TextDecoder();
  private closing = false;

  private constructor(
    private device: BluetoothDevice,
    private writeChar: BluetoothRemoteGATTCharacteristic,
    private notifyChar: BluetoothRemoteGATTCharacteristic,
    private events: TransportEvents,
  ) {}

  static async request(events: TransportEvents): Promise<BleTransport> {
    const device = await navigator.bluetooth.requestDevice({
      filters: [
        { services: [BLE_SERVICE] },
        { namePrefix: 'Free' },
        { namePrefix: 'E1' },
        { namePrefix: 'E3' },
        { namePrefix: 'Hanlin' },
      ],
      optionalServices: [BLE_SERVICE],
    });
    const server = await device.gatt!.connect();
    const service = await server.getPrimaryService(BLE_SERVICE);
    const writeChar = await service.getCharacteristic(BLE_WRITE_CHAR);
    const notifyChar = await service.getCharacteristic(BLE_NOTIFY_CHAR);
    const transport = new BleTransport(device, writeChar, notifyChar, events);
    await transport.start();
    return transport;
  }

  private onNotify = (event: Event) => {
    const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
    if (!value) return;
    const text = this.decoder.decode(new Uint8Array(value.buffer, value.byteOffset, value.byteLength), { stream: true });
    for (const msg of this.parser.push(text)) this.events.onMessage(msg);
  };

  private onGattDisconnected = () => {
    if (!this.closing) this.events.onDisconnect();
  };

  private async start() {
    this.notifyChar.addEventListener('characteristicvaluechanged', this.onNotify);
    this.device.addEventListener('gattserverdisconnected', this.onGattDisconnected);
    await this.notifyChar.startNotifications();
  }

  async write(data: Uint8Array) {
    for (const seg of segment(data, BLE_SEGMENT_LIMIT, this.seq.next())) {
      const buf = seg.slice().buffer;
      if (this.writeChar.properties.writeWithoutResponse) await this.writeChar.writeValueWithoutResponse(buf);
      else await this.writeChar.writeValueWithResponse(buf);
    }
  }

  async close() {
    this.closing = true;
    this.notifyChar.removeEventListener('characteristicvaluechanged', this.onNotify);
    this.device.removeEventListener('gattserverdisconnected', this.onGattDisconnected);
    try {
      await this.notifyChar.stopNotifications();
    } catch {
      /* ignore */
    }
    this.device.gatt?.disconnect();
  }
}
