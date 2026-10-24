import { DEVICES } from '../devices';
import type { Transport, TransportEvents } from './types';

/**
 * A simulated device for trying the UI without hardware (`?demo=Free2`).
 * Answers info queries and accepts everything else.
 */
export class DemoTransport implements Transport {
  readonly kind = 'usb' as const;
  private decoder = new TextDecoder();

  constructor(
    private model: string,
    private events: TransportEvents,
  ) {}

  async write(data: Uint8Array) {
    let cmd: { o?: string; t?: string };
    try {
      cmd = JSON.parse(this.decoder.decode(data));
    } catch {
      return;
    }
    if (cmd.o !== 'get') return;
    const values: Record<string, string> = {
      model: this.model,
      battery: '86',
      mac: 'DE-MO-00-00-00-01',
      firmware: 'V0.15',
    };
    const v = values[cmd.t ?? ''];
    if (v !== undefined) setTimeout(() => this.events.onMessage({ o: 'getresult', t: cmd.t, v }), 40);
  }

  async close() {}
}

/** Firmware model string for a `?demo=` value such as `Free2` or `E1Pro`. */
export function demoModel(param: string | null): string | null {
  if (param === null) return null;
  const def = DEVICES.find((d) => d.id.toLowerCase() === param.toLowerCase()) ?? DEVICES.find((d) => d.id === 'Free2')!;
  return def.models[0];
}
