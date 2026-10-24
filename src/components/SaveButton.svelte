<script lang="ts">
  import { t } from '../lib/i18n/i18n.svelte';
  import Icon from './Icon.svelte';

  interface Props {
    /** Resolves when the device accepted the commands; throw to signal failure. */
    onsave: () => Promise<boolean | void>;
    label?: string;
    disabled?: boolean;
  }

  let { onsave, label, disabled = false }: Props = $props();

  let state = $state<'idle' | 'saving' | 'saved'>('idle');
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function click() {
    if (state === 'saving') return;
    state = 'saving';
    clearTimeout(timer);
    try {
      const ok = await onsave();
      state = ok === false ? 'idle' : 'saved';
      if (ok !== false) timer = setTimeout(() => (state = 'idle'), 1600);
    } catch {
      state = 'idle';
    }
  }
</script>

<button class="btn btn-primary btn-lg save" onclick={click} disabled={disabled || state === 'saving'}>
  {#if state === 'saving'}
    <span class="spinner" aria-hidden="true"></span>{t('web.saving')}
  {:else if state === 'saved'}
    <Icon name="check" size={16} />{t('web.savedShort')}
  {:else}
    {label ?? t('common.save')}
  {/if}
</button>

<style>
  .save {
    min-width: 150px;
  }

  .spinner {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid currentColor;
    border-right-color: transparent;
    animation: spin 700ms linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
