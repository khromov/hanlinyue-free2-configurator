import type { KeyEvent, PhoneAction } from './commands';

/**
 * Key names and Windows virtual-key codes, as the firmware expects them.
 * Ported from the official app so recorded macros are byte-identical.
 */

export interface KeyDef {
  /** Label shown on the keycap (may be a translation key prefixed with `t:`). */
  label: string;
  /** Key name sent to the device. */
  value: string;
  /** Virtual-key code sent to the device. */
  code: number | string;
}

const CODE_MAP: Record<string, { k: string; c: number }> = {
  ControlLeft: { k: 'ControlLeft', c: 162 },
  ControlRight: { k: 'ControlRight', c: 163 },
  AltLeft: { k: 'AltLeft', c: 164 },
  AltRight: { k: 'AltRight', c: 165 },
  ShiftLeft: { k: 'ShiftLeft', c: 160 },
  ShiftRight: { k: 'ShiftRight', c: 161 },
  MetaLeft: { k: 'MetaLeft', c: 91 },
  MetaRight: { k: 'MetaRight', c: 92 },
  ContextMenu: { k: 'ContextMenu', c: 93 },
  Space: { k: ' ', c: 32 },
  Escape: { k: 'Escape', c: 27 },
  Tab: { k: 'Tab', c: 9 },
  CapsLock: { k: 'CapsLock', c: 20 },
  Enter: { k: 'Enter', c: 13 },
  Backspace: { k: 'Backspace', c: 8 },
  Delete: { k: 'Delete', c: 46 },
  Home: { k: 'Home', c: 36 },
  End: { k: 'End', c: 35 },
  PageUp: { k: 'PageUp', c: 33 },
  PageDown: { k: 'PageDown', c: 34 },
  ArrowUp: { k: 'ArrowUp', c: 38 },
  ArrowDown: { k: 'ArrowDown', c: 40 },
  ArrowLeft: { k: 'ArrowLeft', c: 37 },
  ArrowRight: { k: 'ArrowRight', c: 39 },
  AudioVolumeMute: { k: 'AudioVolumeMute', c: 173 },
  AudioVolumeDown: { k: 'AudioVolumeDown', c: 174 },
  AudioVolumeUp: { k: 'AudioVolumeUp', c: 175 },
  MediaTrackPrevious: { k: 'MediaTrackPrevious', c: 177 },
  MediaStop: { k: 'MediaStop', c: 178 },
  MediaTrackNext: { k: 'MediaTrackNext', c: 176 },
  OsLeft: { k: 'MetaLeft', c: 91 },
  OsRight: { k: 'MetaRight', c: 92 },
  Minus: { k: '-', c: 189 },
  Equal: { k: '=', c: 187 },
  BracketLeft: { k: '[', c: 219 },
  BracketRight: { k: ']', c: 221 },
  Backslash: { k: '\\', c: 220 },
  Semicolon: { k: ';', c: 186 },
  Quote: { k: "'", c: 222 },
  Comma: { k: ',', c: 188 },
  Period: { k: '.', c: 190 },
  Slash: { k: '/', c: 191 },
  Backquote: { k: '~', c: 192 },
  NumpadEnter: { k: 'Enter', c: 13 },
};
for (let i = 1; i <= 12; i++) CODE_MAP[`F${i}`] = { k: `F${i}`, c: 111 + i };
for (let i = 0; i <= 9; i++) CODE_MAP[`Numpad${i}`] = { k: String(i), c: 96 + i };

const MODIFIER_FALLBACK: Record<string, { left: [string, number]; right: [string, number]; default: [string, number] }> = {
  Control: { left: ['ControlLeft', 162], right: ['ControlRight', 163], default: ['Control', 17] },
  Alt: { left: ['AltLeft', 164], right: ['AltRight', 165], default: ['Alt', 18] },
  Shift: { left: ['ShiftLeft', 160], right: ['ShiftRight', 161], default: ['Shift', 16] },
  Meta: { left: ['MetaLeft', 91], right: ['MetaRight', 92], default: ['Meta', 91] },
};

export interface NormalizedKey {
  k: string;
  c: number;
  /** Stable id of the physical key, used to pair down/up events. */
  pressId: string;
}

/** Translate a browser KeyboardEvent into the firmware's key name + code. */
export function normalizeKeyboardEvent(e: Pick<KeyboardEvent, 'code' | 'key' | 'keyCode' | 'location'>): NormalizedKey {
  if (e.code && CODE_MAP[e.code]) {
    const { k, c } = CODE_MAP[e.code];
    return { k, c, pressId: e.code };
  }
  if (e.code?.startsWith('Key')) return { k: e.code.slice(3), c: e.keyCode, pressId: e.code };
  if (e.code?.startsWith('Digit')) return { k: e.code.slice(5), c: e.keyCode, pressId: e.code };
  const mod = MODIFIER_FALLBACK[e.key];
  if (mod) {
    const [k, c] = e.location === 1 ? mod.left : e.location === 2 ? mod.right : mod.default;
    return { k, c, pressId: e.code || `${e.key}:${e.location}` };
  }
  return { k: e.key, c: e.keyCode, pressId: e.code || e.key };
}

/** Human labels for key names. Media keys resolve through i18n. */
export const KEY_LABELS: Record<string, string> = {
  ' ': 'Space',
  Control: 'Ctrl',
  ControlLeft: 'L-Ctrl',
  ControlRight: 'R-Ctrl',
  Alt: 'Alt',
  AltLeft: 'L-Alt',
  AltRight: 'R-Alt',
  Shift: 'Shift',
  ShiftLeft: 'L-Shift',
  ShiftRight: 'R-Shift',
  Meta: 'Win',
  MetaLeft: 'L-Win',
  MetaRight: 'R-Win',
  CapsLock: 'Caps Lock',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  PageUp: 'Page Up',
  PageDown: 'Page Down',
  ContextMenu: 'Menu',
  Escape: 'Esc',
};

export const MEDIA_LABEL_KEYS: Record<string, string> = {
  AudioVolumeMute: 'keyboard.media.mute',
  AudioVolumeDown: 'keyboard.media.volumeDown',
  AudioVolumeUp: 'keyboard.media.volumeUp',
  MediaTrackPrevious: 'keyboard.media.previous',
  MediaStop: 'keyboard.media.pause',
  MediaTrackNext: 'keyboard.media.next',
};

export function keyLabel(k: string, t: (key: string) => string): string {
  if (MEDIA_LABEL_KEYS[k]) return t(MEDIA_LABEL_KEYS[k]);
  return KEY_LABELS[k] ?? k;
}

/** Summarise a key-event list as "Ctrl + C". */
export function describeEvents(events: KeyEvent[], t: (key: string) => string): string {
  const keys: string[] = [];
  for (const e of events) if (e.t === 'down' && !keys.includes(e.k)) keys.push(e.k);
  return keys.map((k) => keyLabel(k, t)).join(' + ');
}

// ---------------------------------------------------------------------------
// Virtual keyboard layout (same keys and codes as the official picker)

const k = (label: string, value: string, code: number | string): KeyDef => ({ label, value, code });

export const MEDIA_ROW: KeyDef[] = [
  k('Esc', 'Escape', 27),
  k('t:keyboard.media.mute', 'AudioVolumeMute', 173),
  k('t:keyboard.media.volumeDown', 'AudioVolumeDown', 174),
  k('t:keyboard.media.volumeUp', 'AudioVolumeUp', 175),
  k('t:keyboard.media.previous', 'MediaTrackPrevious', 177),
  k('t:keyboard.media.pause', 'MediaStop', 178),
  k('t:keyboard.media.next', 'MediaTrackNext', 176),
];

export const FUNCTION_ROW: KeyDef[] = Array.from({ length: 12 }, (_, i) => k(`F${i + 1}`, `F${i + 1}`, 112 + i));

export const NUMBER_ROW: KeyDef[] = [
  k('~', '~', 192),
  ...'1234567890'.split('').map((d) => k(d, d, d.charCodeAt(0))),
  k('-', '-', 189),
  k('=', '=', 187),
  k('Backspace', 'Backspace', 8),
  k('Delete', 'Delete', 46),
];

export const TOP_ROW: KeyDef[] = [
  k('Tab', 'Tab', 9),
  ...'QWERTYUIOP'.split('').map((c) => k(c, c, c.charCodeAt(0))),
  k('[', '[', 219),
  k(']', ']', 221),
  k('\\', '\\', 220),
];

export const HOME_ROW: KeyDef[] = [
  k('Caps Lock', 'CapsLock', 20),
  ...'ASDFGHJKL'.split('').map((c) => k(c, c, c.charCodeAt(0))),
  k(';', ';', 186),
  k("'", "'", 222),
  k('Enter', 'Enter', 13),
];

export const BOTTOM_ROW: KeyDef[] = [
  k('Shift', 'Shift', 16),
  ...'ZXCVBNM'.split('').map((c) => k(c, c, c.charCodeAt(0))),
  k(',', ',', 188),
  k('.', '.', 190),
  k('/', '/', 191),
];

export const SPACE_ROW: KeyDef[] = [
  k('L-Ctrl', 'ControlLeft', 162),
  k('Win', 'MetaLeft', 91),
  k('L-Alt', 'AltLeft', 164),
  k('Space', ' ', 32),
  k('R-Alt', 'AltRight', 165),
  k('Win', 'MetaRight', 92),
  k('Menu', 'ContextMenu', 93),
  k('R-Ctrl', 'ControlRight', 163),
];

export const NAV_KEYS: KeyDef[] = [
  k('Home', 'Home', 36),
  k('End', 'End', 35),
  k('Page Up', 'PageUp', 33),
  k('Page Down', 'PageDown', 34),
];

export const ARROW_KEYS: KeyDef[] = [
  k('↑', 'ArrowUp', 38),
  k('↓', 'ArrowDown', 40),
  k('←', 'ArrowLeft', 37),
  k('→', 'ArrowRight', 39),
];

export const MAC_KEYS: KeyDef[] = [
  k('⌘ L', 'MetaLeft', 91),
  k('⌥ L', 'AltLeft', 164),
  k('⌃ L', 'ControlLeft', 162),
  k('⇧ L', 'ShiftLeft', 160),
  k('⌘ R', 'MetaRight', 92),
  k('⌥ R', 'AltRight', 165),
  k('⌃ R', 'ControlRight', 163),
  k('⇧ R', 'ShiftRight', 161),
  k('Fn', 'Fn', 'Fn'),
  k('Eject', 'Eject', 'Eject'),
];

export interface PhoneActionDef {
  value: PhoneAction;
  labelKey: string;
}

export const PHONE_ACTIONS: PhoneActionDef[] = [
  { value: 'like', labelKey: 'keyboard.phone.like' },
  { value: 'lockscreen', labelKey: 'keyboard.phone.lockScreen' },
  { value: 'speed', labelKey: 'keyboard.phone.speed' },
  { value: 'slideleft', labelKey: 'keyboard.phone.slideLeft' },
  { value: 'slideright', labelKey: 'keyboard.phone.slideRight' },
  { value: 'slideup', labelKey: 'keyboard.phone.slideUp' },
  { value: 'slidedown', labelKey: 'keyboard.phone.slideDown' },
  { value: 'pause', labelKey: 'keyboard.phone.pause' },
  { value: 'back', labelKey: 'keyboard.phone.back' },
  { value: 'home', labelKey: 'keyboard.phone.home' },
];

/** Phone actions offered for repeating scripts (subset used by the official app). */
export const SCRIPT_PHONE_ACTIONS: PhoneActionDef[] = PHONE_ACTIONS.filter((a) =>
  ['like', 'slideleft', 'slideright', 'slideup', 'slidedown'].includes(a.value),
);

const MODIFIERS = new Set([
  'Control',
  'Shift',
  'Alt',
  'Meta',
  'ControlLeft',
  'ControlRight',
  'AltLeft',
  'AltRight',
  'ShiftLeft',
  'ShiftRight',
  'MetaLeft',
  'MetaRight',
]);

export const MAX_COMBO_KEYS = 5;

/**
 * Build the event list for a key combo picked on the virtual keyboard:
 * hold modifiers, tap each other key, release modifiers in reverse.
 * Waits are 30 ms, the value the official app ends up sending.
 */
export function comboToEvents(keys: KeyDef[], waitMs = 30): KeyEvent[] {
  const mods = keys.filter((key) => MODIFIERS.has(key.value));
  const others = keys.filter((key) => !MODIFIERS.has(key.value));
  const events: KeyEvent[] = [];
  const wait = () => events.push({ t: 'wait', ms: waitMs });

  mods.forEach((m, i) => {
    events.push({ t: 'down', k: m.value, c: m.code });
    if (i < mods.length - 1 || others.length > 0) wait();
  });
  others.forEach((o, i) => {
    events.push({ t: 'down', k: o.value, c: o.code });
    wait();
    events.push({ t: 'up', k: o.value, c: o.code });
    if (i < others.length - 1) wait();
  });
  [...mods].reverse().forEach((m) => {
    wait();
    events.push({ t: 'up', k: m.value, c: m.code });
  });
  return events;
}

export const ALL_VIRTUAL_KEYS: KeyDef[] = [
  ...MEDIA_ROW,
  ...FUNCTION_ROW,
  ...NUMBER_ROW,
  ...TOP_ROW,
  ...HOME_ROW,
  ...BOTTOM_ROW,
  ...SPACE_ROW,
  ...NAV_KEYS,
  ...ARROW_KEYS,
  ...MAC_KEYS,
];
