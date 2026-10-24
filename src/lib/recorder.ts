import type { KeyEvent } from './protocol/commands';
import { normalizeKeyboardEvent } from './protocol/keys';

/**
 * Records physical key presses into the firmware's event format,
 * with real delays between events (consecutive waits are merged).
 */
export class MacroRecorder {
  events: KeyEvent[] = [];
  private pressed = new Map<string, { k: string; c: number }>();
  private lastTime: number | null = null;

  constructor(private now: () => number = () => performance.now()) {}

  private addWait() {
    const time = this.now();
    if (this.lastTime !== null) {
      const ms = Math.round(time - this.lastTime);
      if (ms > 0) {
        const last = this.events[this.events.length - 1];
        if (last?.t === 'wait') last.ms += ms;
        else this.events.push({ t: 'wait', ms });
      }
    }
    this.lastTime = time;
  }

  keydown(e: Pick<KeyboardEvent, 'code' | 'key' | 'keyCode' | 'location'>) {
    const { k, c, pressId } = normalizeKeyboardEvent(e);
    if (this.pressed.has(pressId)) return; // auto-repeat
    this.addWait();
    this.pressed.set(pressId, { k, c });
    this.events.push({ t: 'down', k, c });
  }

  keyup(e: Pick<KeyboardEvent, 'code' | 'key' | 'keyCode' | 'location'>) {
    const { k, c, pressId } = normalizeKeyboardEvent(e);
    if (!this.pressed.has(pressId)) return;
    this.addWait();
    this.pressed.delete(pressId);
    this.events.push({ t: 'up', k, c });
  }

  /** Release anything still held and drop trailing waits. */
  finish(): KeyEvent[] {
    for (const { k, c } of [...this.pressed.values()].reverse()) this.events.push({ t: 'up', k, c });
    this.pressed.clear();
    while (this.events.length && this.events[this.events.length - 1].t === 'wait') this.events.pop();
    return this.events;
  }
}
