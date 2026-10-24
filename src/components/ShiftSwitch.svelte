<script lang="ts">
  import { device } from '../lib/device.svelte';
  import { t } from '../lib/i18n/i18n.svelte';
  import type { Shift } from '../lib/protocol/commands';

  const POSITIONS: Shift[] = ['P', 'M', 'R'];
</script>

{#if device.device?.hasShift}
  <div class="shift">
    <span class="caps">{t('web.shift.label')}</span>
    <div class="segmented" role="group" aria-label={t('web.shift.label')}>
      {#each POSITIONS as pos (pos)}
        <button type="button" class="mono" aria-pressed={device.shift === pos} onclick={() => device.setShift(pos)}>
          {pos}
        </button>
      {/each}
    </div>
    <p class="hint">{t('web.shift.hint')}</p>
  </div>
{/if}

<style>
  .shift {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    text-align: center;
  }

  .segmented button {
    min-width: 44px;
  }

  .hint {
    font-size: 12px;
    color: var(--muted);
    max-width: 260px;
  }
</style>
