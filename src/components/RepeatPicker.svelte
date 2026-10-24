<script lang="ts">
  import { t } from '../lib/i18n/i18n.svelte';
  import type { Repeat } from '../lib/protocol/commands';

  let { value = $bindable() }: { value: Repeat } = $props();

  /** Remembered while "forever" is selected so switching back keeps the number. */
  let count = $state(1);
  const uid = $props.id();

  $effect.pre(() => {
    if (typeof value === 'number') count = value;
  });

  function setCount(raw: string) {
    const n = Math.max(1, Math.min(9999, Math.round(Number(raw) || 1)));
    count = n;
    value = n;
  }
</script>

<section class="card block">
  <h3>{t('script.repeatSetting')}</h3>
  <div class="options" role="radiogroup" aria-label={t('script.repeatSetting')}>
    <label class="option" class:active={value !== 'forever'}>
      <input type="radio" name="{uid}-repeat" checked={value !== 'forever'} onchange={() => (value = count)} />
      <span>{t('script.repeatNumber')}</span>
      <input
        class="input mono count"
        type="number"
        min="1"
        max="9999"
        value={count}
        aria-label={t('script.repeatPlaceholder')}
        onfocus={() => (value = count)}
        oninput={(e) => setCount(e.currentTarget.value)}
      />
    </label>
    <label class="option" class:active={value === 'forever'}>
      <input type="radio" name="{uid}-repeat" checked={value === 'forever'} onchange={() => (value = 'forever')} />
      <span>{t('script.repeatForever')}</span>
    </label>
  </div>
</section>

<style>
  .block {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 8px;
  }

  .option {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    padding: 8px 12px;
    border-radius: var(--r-sm);
    border: 1px solid var(--border);
    cursor: pointer;
    font-weight: 550;
  }

  .option.active {
    border-color: var(--accent);
    background: var(--accent-tint);
  }

  .option input[type='radio'] {
    accent-color: var(--accent);
    margin: 0;
  }

  .count {
    width: 84px;
    margin-left: auto;
  }
</style>
