/**
 * Supported Hanlinyue models, matching the official app's device registry.
 * The firmware reports its model via `{"o":"get","t":"model"}`.
 */

export type DeviceId = 'E1Pro' | 'Free2' | 'Free2_2026' | 'Free3' | 'E3Control';

export type ButtonSlot = 'k1' | 'k2' | 'k3' | 'plus' | 'minus' | 'switch';

export interface Preset {
  /** i18n key of the preset title. */
  nameKey: string;
  /** i18n keys of the per-button labels shown on the device. */
  labels: Partial<Record<ButtonSlot, string>>;
  /** Value of `{"o":"set","m":"preset","v":...}`. */
  value: string;
}

export interface DeviceDef {
  id: DeviceId;
  /** Model strings reported by the firmware. */
  models: string[];
  displayName: string;
  buttonCount: 2 | 3;
  hasLight: boolean;
  /** Has a P/M/R slide switch whose position is sent with each `set`. */
  hasShift: boolean;
  descriptionKey: string;
  presets: Preset[];
}

function presets(prefix: string, values: string[], slots: ButtonSlot[], extra: Record<number, ButtonSlot[]> = {}): Preset[] {
  return values.map((value, i) => {
    const n = i + 1;
    const labels: Partial<Record<ButtonSlot, string>> = {};
    for (const slot of [...slots, ...(extra[n] ?? [])]) labels[slot] = `function.${prefix}.func${n}.keys.${slot}`;
    return { nameKey: `function.${prefix}.func${n}.name`, labels, value };
  });
}

const FREE2_PRESETS = presets(
  'free2',
  ['pageturn_android', 'keyboard_lr', 'keyboard_pud', 'keyboard_cv', 'mouse_1', 'mouse_2', 'keyboard_ud', 'mouse_3'],
  ['k1', 'k2'],
  { 8: ['switch'] },
);

const FREE3_PRESETS = presets(
  'free3',
  ['pageturn_android', 'keyboard_lr', 'keyboard_pud', 'keyboard_cvx', 'keyboard_ud', 'mouse_1', 'mouse_2', 'mouse_3'],
  ['k1', 'k2', 'k3'],
);

export const DEVICES: DeviceDef[] = [
  {
    id: 'E1Pro',
    models: ['E1 Pro'],
    displayName: 'E1 Pro',
    buttonCount: 3,
    hasLight: false,
    hasShift: false,
    descriptionKey: 'function.e1pro.description',
    presets: presets(
      'e1pro',
      [
        'pageturn_android',
        'pageturn_kobo',
        'keyboard_ud',
        'keyboard_lr',
        'keyboard_pud',
        'keyboard_cv_a',
        'keyboard_cv_i',
        'mouse_3',
      ],
      ['k1', 'k2', 'k3', 'plus', 'minus'],
    ),
  },
  {
    id: 'Free2',
    models: ['Free 2'],
    displayName: 'Free2',
    buttonCount: 2,
    hasLight: true,
    hasShift: false,
    descriptionKey: 'function.free2.description',
    presets: FREE2_PRESETS,
  },
  {
    id: 'Free2_2026',
    models: ['Free2 2026'],
    displayName: 'Free2 2026',
    buttonCount: 2,
    hasLight: true,
    hasShift: true,
    descriptionKey: 'function.free2.description',
    presets: FREE2_PRESETS,
  },
  {
    id: 'Free3',
    models: ['Free 3'],
    displayName: 'Free3',
    buttonCount: 3,
    hasLight: true,
    hasShift: true,
    descriptionKey: 'function.free3.description',
    presets: FREE3_PRESETS,
  },
  {
    id: 'E3Control',
    models: ['E3 Control'],
    displayName: 'E3 Control',
    buttonCount: 3,
    hasLight: false,
    hasShift: true,
    descriptionKey: 'function.free3.description',
    presets: FREE3_PRESETS,
  },
];

/** Firmware spells "Free2 2026" a few different ways. */
export function normalizeModel(model: string): string {
  const trimmed = model.trim();
  return trimmed.replace(/[\s-]+/g, '').toLowerCase() === 'free22026' ? 'Free2 2026' : trimmed;
}

export function findDevice(model: string | null | undefined): DeviceDef | null {
  if (!model) return null;
  const normalized = normalizeModel(model);
  return DEVICES.find((d) => d.models.includes(model) || d.models.includes(normalized)) ?? null;
}

/** Buttons the user can map: 1..buttonCount. */
export function buttonNumbers(device: DeviceDef | null): number[] {
  const n = device?.buttonCount ?? 2;
  return Array.from({ length: n }, (_, i) => i + 1);
}
