import { describe, expect, it } from 'vitest';
import { findDevice, normalizeModel } from '../devices';
import { MacroRecorder } from '../recorder';
import { setAllWaits, setKeyboard, setLight, setMouse, setPreset, withShift } from './commands';
import { JsonStreamParser, SequenceCounter, USB_SEGMENT_LIMIT, encodeCommand, segment } from './framing';
import { ALL_VIRTUAL_KEYS, comboToEvents, describeEvents, normalizeKeyboardEvent } from './keys';

const decode = (b: Uint8Array) => new TextDecoder().decode(b);

describe('segment', () => {
  it('leaves short commands untouched', () => {
    const data = encodeCommand({ o: 'get', t: 'model' });
    expect(segment(data, USB_SEGMENT_LIMIT, 1)).toEqual([data]);
  });

  it('splits long commands into 55-byte chunks with S{seq}[i/n] prefixes like the official driver', () => {
    const cmd = setKeyboard(1, 'click', comboToEvents(ALL_VIRTUAL_KEYS.filter((k) => k.value === 'ControlLeft' || k.value === 'C')));
    const data = encodeCommand(cmd);
    const segs = segment(data, USB_SEGMENT_LIMIT, 3);
    const total = Math.ceil(data.length / 55);
    expect(segs).toHaveLength(total);
    segs.forEach((s, i) => {
      expect(decode(s).startsWith(`S3[${i + 1}/${total}]`)).toBe(true);
      expect(s.length).toBeLessThanOrEqual(USB_SEGMENT_LIMIT);
    });
    const payload = segs.map((s) => decode(s).replace(/^S\d\[\d+\/\d+\]/, '')).join('');
    expect(JSON.parse(payload)).toEqual(cmd);
  });

  it('cycles the sequence number 1..9', () => {
    const c = new SequenceCounter();
    const seen = Array.from({ length: 11 }, () => c.next());
    expect(seen).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2]);
  });
});

describe('JsonStreamParser', () => {
  it('parses concatenated and fragmented replies', () => {
    const p = new JsonStreamParser();
    expect(p.push('{"o":"getresult","t":"model","v":"Free 2"}{"o":"getre')).toEqual([
      { o: 'getresult', t: 'model', v: 'Free 2' },
    ]);
    expect(p.push('sult","t":"battery","v":"100"}')).toEqual([{ o: 'getresult', t: 'battery', v: '100' }]);
  });

  it('handles braces inside strings and skips noise', () => {
    const p = new JsonStreamParser();
    expect(p.push('\r\nxx{"v":"a}b{c","n":{"x":1}}\n')).toEqual([{ v: 'a}b{c', n: { x: 1 } }]);
  });
});

describe('commands', () => {
  it('builds the official command shapes', () => {
    expect(setPreset('keyboard_lr')).toEqual({ o: 'set', m: 'preset', v: 'keyboard_lr' });
    expect(setMouse(2, 'doubleclick', 'like')).toEqual({ o: 'set', k: 2, m: 'mouse', e: 'doubleclick', v: 'like', r: 1 });
    expect(setMouse(1, 'click', 'slideup', 'forever').r).toBe('forever');
    expect(setLight(1, { enable: true, animate: '2' })).toEqual({ o: 'set', k: 1, m: 'light', v: { enable: true, animate: '2' } });
  });

  it('adds the slide switch position only to set commands', () => {
    expect(withShift(setPreset('mouse_1'), 'P')).toEqual({ o: 'set', m: 'preset', v: 'mouse_1', s: 'P' });
    expect(withShift({ o: 'get', t: 'model' }, 'P')).toEqual({ o: 'get', t: 'model' });
    expect(withShift(setPreset('mouse_1'), null)).toEqual(setPreset('mouse_1'));
  });

  it('rewrites waits', () => {
    expect(setAllWaits([{ t: 'down', k: 'A', c: 65 }, { t: 'wait', ms: 5 }], 30)).toEqual([
      { t: 'down', k: 'A', c: 65 },
      { t: 'wait', ms: 30 },
    ]);
  });
});

describe('keys', () => {
  const pick = (...values: string[]) => values.map((v) => ALL_VIRTUAL_KEYS.find((k) => k.value === v)!);

  it('holds modifiers around the other keys, like the official picker', () => {
    expect(comboToEvents(pick('ControlLeft', 'C'))).toEqual([
      { t: 'down', k: 'ControlLeft', c: 162 },
      { t: 'wait', ms: 30 },
      { t: 'down', k: 'C', c: 67 },
      { t: 'wait', ms: 30 },
      { t: 'up', k: 'C', c: 67 },
      { t: 'wait', ms: 30 },
      { t: 'up', k: 'ControlLeft', c: 162 },
    ]);
  });

  it('taps a single key', () => {
    expect(comboToEvents(pick('PageDown'))).toEqual([
      { t: 'down', k: 'PageDown', c: 34 },
      { t: 'wait', ms: 30 },
      { t: 'up', k: 'PageDown', c: 34 },
    ]);
  });

  it('normalizes browser key events', () => {
    expect(normalizeKeyboardEvent({ code: 'KeyA', key: 'a', keyCode: 65, location: 0 })).toEqual({ k: 'A', c: 65, pressId: 'KeyA' });
    expect(normalizeKeyboardEvent({ code: 'ShiftLeft', key: 'Shift', keyCode: 16, location: 1 }).c).toBe(160);
    expect(normalizeKeyboardEvent({ code: 'Space', key: ' ', keyCode: 32, location: 0 }).k).toBe(' ');
  });

  it('describes events', () => {
    expect(describeEvents(comboToEvents(pick('ControlLeft', 'V')), (k) => k)).toBe('L-Ctrl + V');
  });
});

describe('MacroRecorder', () => {
  it('records presses with real delays and closes held keys', () => {
    let now = 0;
    const r = new MacroRecorder(() => now);
    r.keydown({ code: 'KeyH', key: 'h', keyCode: 72, location: 0 });
    now = 40;
    r.keydown({ code: 'KeyH', key: 'h', keyCode: 72, location: 0 }); // auto-repeat, ignored
    now = 80;
    r.keyup({ code: 'KeyH', key: 'h', keyCode: 72, location: 0 });
    now = 200;
    r.keydown({ code: 'KeyI', key: 'i', keyCode: 73, location: 0 });
    expect(r.finish()).toEqual([
      { t: 'down', k: 'H', c: 72 },
      { t: 'wait', ms: 80 },
      { t: 'up', k: 'H', c: 72 },
      { t: 'wait', ms: 120 },
      { t: 'down', k: 'I', c: 73 },
      { t: 'up', k: 'I', c: 73 },
    ]);
  });
});

describe('devices', () => {
  it('maps firmware model strings', () => {
    expect(findDevice('Free 2')?.id).toBe('Free2');
    expect(findDevice('Free 3')?.id).toBe('Free3');
    expect(findDevice('E1 Pro')?.id).toBe('E1Pro');
    expect(findDevice('E3 Control')?.id).toBe('E3Control');
    expect(findDevice('free2-2026')?.id).toBe('Free2_2026');
    expect(normalizeModel(' Free 2 2026 ')).toBe('Free2 2026');
    expect(findDevice('Mystery')).toBeNull();
  });

  it('only the switch models send a shift', () => {
    expect(findDevice('Free 2')?.hasShift).toBe(false);
    expect(findDevice('Free 3')?.hasShift).toBe(true);
  });
});
