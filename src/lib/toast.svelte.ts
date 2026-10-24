export type ToastKind = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

let nextId = 1;

class ToastStore {
  items = $state<Toast[]>([]);

  show(message: string, kind: ToastKind = 'info', timeout = 4000) {
    const id = nextId++;
    this.items.push({ id, kind, message });
    if (timeout > 0) setTimeout(() => this.dismiss(id), timeout);
  }

  success = (message: string) => this.show(message, 'success');
  error = (message: string) => this.show(message, 'error', 6000);
  warning = (message: string) => this.show(message, 'warning');

  dismiss(id: number) {
    this.items = this.items.filter((t) => t.id !== id);
  }
}

export const toasts = new ToastStore();
