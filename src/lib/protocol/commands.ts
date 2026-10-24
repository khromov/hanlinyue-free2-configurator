/**
 * Command builders mirroring the official app's protocol helpers.
 * Every command is a plain JSON object sent to the device.
 */

export type Layer = 'click' | 'doubleclick' | 'longpress';
export type Shift = 'P' | 'M' | 'R';
export type Repeat = number | 'forever';

export type KeyEvent =
  | { t: 'down'; k: string; c: number | string }
  | { t: 'up'; k: string; c: number | string }
  | { t: 'wait'; ms: number };

export type InfoTopic = 'battery' | 'mac' | 'firmware' | 'model';

export type Command = Record<string, unknown> & { o: 'get' | 'set' };

export type PhoneAction =
  | 'like'
  | 'lockscreen'
  | 'speed'
  | 'slideleft'
  | 'slideright'
  | 'slideup'
  | 'slidedown'
  | 'pause'
  | 'back'
  | 'home';

export const getInfo = (t: InfoTopic): Command => ({ o: 'get', t });

export const setPreset = (value: string): Command => ({ o: 'set', m: 'preset', v: value });

export const setKeyboard = (key: number, layer: Layer, events: KeyEvent[], repeat: Repeat = 1): Command => ({
  o: 'set',
  k: key,
  m: 'keyboard',
  e: layer,
  v: events,
  r: repeat,
});

export const setMouse = (key: number, layer: Layer, action: PhoneAction, repeat: Repeat = 1): Command => ({
  o: 'set',
  k: key,
  m: 'mouse',
  e: layer,
  v: action,
  r: repeat,
});

export type LightValue =
  | { enable: false }
  | { enable: true; animate: '1' | '2' }
  | { enable: true; rgb: string; bri: number };

export const setLight = (key: number, value: LightValue): Command => ({ o: 'set', k: key, m: 'light', v: value });

/** Models with a P/M/R slide switch get the current position on every `set`. */
export function withShift(cmd: Command, shift: Shift | null): Command {
  return shift && cmd.o === 'set' ? { ...cmd, s: shift } : cmd;
}

/** Tap a single key: down, 30 ms, up. Used by built-in quick presets. */
export const tap = (k: string, c: number): KeyEvent[] => [
  { t: 'down', k, c },
  { t: 'wait', ms: 30 },
  { t: 'up', k, c },
];

export function setAllWaits(events: KeyEvent[], ms: number): KeyEvent[] {
  return events.map((e) => (e.t === 'wait' ? { ...e, ms } : e));
}

/** Size of a command on the wire, used for the 150 KB macro limit. */
export function commandSizeKb(cmd: Command): number {
  return new Blob([JSON.stringify(cmd)]).size / 1024;
}

export const MACRO_LIMIT_KB = 150;
