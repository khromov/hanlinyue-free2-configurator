<script lang="ts">
  import { t } from '../lib/i18n/i18n.svelte';
  import { LAYERS } from '../lib/mapping';
  import type { Layer } from '../lib/protocol/commands';

  let { value = $bindable() }: { value: Layer } = $props();
</script>

<section class="card block">
  <div class="head">
    <h3>{t('web.layer.title')}</h3>
    <div class="segmented" role="group" aria-label={t('web.layer.title')}>
      {#each LAYERS as layer (layer)}
        <button type="button" aria-pressed={value === layer} onclick={() => (value = layer)}>
          {t(`web.layer.${layer}`)}
        </button>
      {/each}
    </div>
  </div>
  <p class="muted desc">{t(`layer.${value}Desc`)}</p>
</section>

<style>
  .block {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .desc {
    font-size: 13px;
  }
</style>
