/** A single app-wide message dialog (the "one more step" notice after saving). */

export interface DialogOptions {
  title: string;
  body: string;
  confirm: string;
}

class DialogStore {
  current = $state<DialogOptions | null>(null);

  open(options: DialogOptions) {
    this.current = options;
  }

  close() {
    this.current = null;
  }
}

export const dialog = new DialogStore();
