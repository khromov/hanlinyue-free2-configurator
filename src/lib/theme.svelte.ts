import { load, save } from './storage';

export type Theme = 'system' | 'light' | 'dark';

class ThemeStore {
  value = $state<Theme>(load<Theme>('hly:theme', 'system'));

  apply() {
    const root = document.documentElement;
    if (this.value === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', this.value);
  }

  set(value: Theme) {
    this.value = value;
    save('hly:theme', value);
    this.apply();
  }
}

export const theme = new ThemeStore();
