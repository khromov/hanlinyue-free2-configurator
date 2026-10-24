<script lang="ts">
  import type { DeviceDef } from '../lib/devices';
  import { t } from '../lib/i18n/i18n.svelte';
  import { load, save } from '../lib/storage';
  import KeyboardMacro from './scripts/KeyboardMacro.svelte';
  import PhoneScript from './scripts/PhoneScript.svelte';

  let { def }: { def: DeviceDef } = $props();

  let tab = $state<'phone' | 'keyboard'>(load('hly:scripts-tab', 'phone'));
  $effect(() => {
    save('hly:scripts-tab', tab);
  });
</script>

<div class="tabs-wrap">
  <div class="segmented big" role="tablist" aria-label={t('sidebar.script')}>
    <button role="tab" aria-selected={tab === 'phone'} onclick={() => (tab = 'phone')}>{t('web.scripts.phoneTab')}</button>
    <button role="tab" aria-selected={tab === 'keyboard'} onclick={() => (tab = 'keyboard')}>
      {t('web.scripts.keyboardTab')}
    </button>
  </div>
</div>

{#if tab === 'phone'}
  <PhoneScript {def} />
{:else}
  <KeyboardMacro {def} />
{/if}

<style>
  .tabs-wrap {
    padding: 24px 32px 0;
  }

  .big button {
    height: 34px;
    padding: 0 16px;
    font-size: 14px;
  }

  @media (max-width: 760px) {
    .tabs-wrap {
      padding: 16px 16px 0;
    }
    .segmented {
      width: 100%;
    }
    .segmented button {
      flex: 1;
    }
  }
</style>
