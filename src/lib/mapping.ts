import { setKeyboard, setMouse, type Command, type KeyEvent, type Layer, type PhoneAction } from './protocol/commands';
import { PHONE_ACTIONS, describeEvents } from './protocol/keys';

/** What one button does on one layer. */
export type Mapping = { mode: 'keyboard'; events: KeyEvent[] } | { mode: 'phone'; action: PhoneAction };

export type ButtonMap = Partial<Record<number, Mapping>>;
export type LayerMap = Record<Layer, ButtonMap>;

export const LAYERS: Layer[] = ['click', 'doubleclick', 'longpress'];

export const emptyLayers = (): LayerMap => ({ click: {}, doubleclick: {}, longpress: {} });

export function describeMapping(mapping: Mapping | undefined, t: (key: string) => string): string {
  if (!mapping) return '';
  if (mapping.mode === 'phone') {
    const def = PHONE_ACTIONS.find((a) => a.value === mapping.action);
    return def ? t(def.labelKey) : mapping.action;
  }
  return describeEvents(mapping.events, t);
}

export function mappingCommand(button: number, layer: Layer, mapping: Mapping): Command {
  return mapping.mode === 'phone'
    ? setMouse(button, layer, mapping.action)
    : setKeyboard(button, layer, plain(mapping.events), 1);
}

/** Commands for every configured button on every layer. */
export function layerCommands(layers: LayerMap, buttons: number[]): Command[] {
  const cmds: Command[] = [];
  for (const layer of LAYERS) {
    for (const n of buttons) {
      const mapping = layers[layer][n];
      if (mapping) cmds.push(mappingCommand(n, layer, mapping));
    }
  }
  return cmds;
}

/** Plain copy, detached from Svelte state proxies. */
export function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
