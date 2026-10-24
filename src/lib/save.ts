import { device, errorMessage } from './device.svelte';
import { dialog } from './dialog.svelte';
import { t } from './i18n/i18n.svelte';
import type { Command } from './protocol/commands';
import { toasts } from './toast.svelte';

interface SaveOptions {
  /** Show the "unplug to pair" dialog the official app shows after big changes. */
  afterSaveDialog?: boolean;
}

/** Send commands, report the outcome, and return whether it worked. */
export async function sendAndReport(cmds: Command[], options: SaveOptions = {}): Promise<boolean> {
  try {
    await device.sendAll(cmds);
  } catch (err) {
    toasts.error(t('web.errors.sendFailed', { message: errorMessage(err) }));
    return false;
  }
  toasts.success(t('common.saved'));
  if (options.afterSaveDialog) showAfterSaveDialog();
  return true;
}

export function showAfterSaveDialog() {
  dialog.open({
    title: t('common.alertDiscountTitle'),
    body: t('web.afterSave.body'),
    confirm: t('common.iUnderstand'),
  });
}
