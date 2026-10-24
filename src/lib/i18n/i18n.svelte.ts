import officialEn from './official/en.json';
import webEn from './web/en.json';

/**
 * Translations come from two places: `official/` holds strings extracted from
 * the vendor app (so wording matches what owners already know), `web/` holds
 * strings for UI that only exists in this configurator. English is bundled;
 * other languages load on demand.
 */

export const LOCALES = [
  { id: 'en', name: 'English' },
  { id: 'zh-CN', name: '简体中文' },
  { id: 'zh-TW', name: '繁體中文' },
  { id: 'ja', name: '日本語' },
  { id: 'ko', name: '한국어' },
  { id: 'de', name: 'Deutsch' },
  { id: 'fr', name: 'Français' },
  { id: 'es', name: 'Español' },
  { id: 'it', name: 'Italiano' },
  { id: 'ru', name: 'Русский' },
] as const;

export type LocaleId = (typeof LOCALES)[number]['id'];

type Messages = Record<string, unknown>;

const officialLoaders = import.meta.glob<{ default: Messages }>('./official/*.json');
const webLoaders = import.meta.glob<{ default: Messages }>('./web/*.json');

const english: Messages = { ...officialEn, web: webEn };
const STORAGE_KEY = 'hly:language';

function detectLocale(): LocaleId {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {
    /* storage blocked */
  }
  if (saved && LOCALES.some((l) => l.id === saved)) return saved as LocaleId;
  for (const lang of navigator.languages ?? [navigator.language]) {
    const lower = lang.toLowerCase();
    if (lower.startsWith('zh')) return /tw|hk|mo|hant/.test(lower) ? 'zh-TW' : 'zh-CN';
    const base = lower.split('-')[0];
    const match = LOCALES.find((l) => l.id === base);
    if (match) return match.id;
  }
  return 'en';
}

function lookup(messages: Messages, key: string): unknown {
  let node: unknown = messages;
  for (const part of key.split('.')) {
    if (node && typeof node === 'object' && part in node) node = (node as Messages)[part];
    else return undefined;
  }
  return node;
}

/** vue-i18n style: `{name}` placeholders and `{'@'}` literals. */
function format(template: string, params?: Record<string, string | number>): string {
  return template.replace(/\{\s*(?:'([^']*)'|(\w+))\s*\}/g, (match, literal, name) => {
    if (literal !== undefined) return literal;
    return params && name in params ? String(params[name]) : match;
  });
}

class I18n {
  locale = $state<LocaleId>('en');
  private messages = $state.raw<Messages>(english);

  t = (key: string, params?: Record<string, string | number>): string => {
    const value = lookup(this.messages, key) ?? lookup(english, key);
    return typeof value === 'string' ? format(value, params) : key;
  };

  /** Like `t`, but returns undefined instead of the key when missing or empty. */
  maybe = (key: string): string | undefined => {
    const value = lookup(this.messages, key) ?? lookup(english, key);
    return typeof value === 'string' && value !== '' ? value : undefined;
  };

  async setLocale(id: LocaleId) {
    if (id === 'en') {
      this.messages = english;
    } else {
      const [official, web] = await Promise.all([
        officialLoaders[`./official/${id}.json`]?.(),
        webLoaders[`./web/${id}.json`]?.(),
      ]);
      this.messages = { ...(official?.default ?? {}), web: web?.default ?? {} };
    }
    this.locale = id;
    document.documentElement.lang = id;
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* storage blocked */
    }
  }

  init() {
    return this.setLocale(detectLocale());
  }
}

export const i18n = new I18n();
export const t = i18n.t;
