<script lang="ts">
  import DeviceVisual from '../components/DeviceVisual.svelte';
  import Icon from '../components/Icon.svelte';
  import Page from '../components/Page.svelte';
  import SaveButton from '../components/SaveButton.svelte';
  import ShiftSwitch from '../components/ShiftSwitch.svelte';
  import { device } from '../lib/device.svelte';
  import type { DeviceDef, Preset } from '../lib/devices';
  import { t } from '../lib/i18n/i18n.svelte';
  import { setPreset } from '../lib/protocol/commands';
  import { sendAndReport } from '../lib/save';
  import { deviceKey, load, save } from '../lib/storage';

  let { def }: { def: DeviceDef } = $props();

  const storeKey = $derived(deviceKey(def.id, 'preset'));
  let lastSaved = $state<string | null>(null);
  let selected = $state<Preset | null>(null);
  let flash = $state(false);

  $effect(() => {
    lastSaved = load<string | null>(storeKey, null);
    selected = def.presets.find((p) => p.value === lastSaved) ?? null;
  });

  const labels = $derived.by(() => {
    if (!selected) return {};
    const out: Record<number, string> = {};
    if (selected.labels.k1) out[1] = t(selected.labels.k1);
    if (selected.labels.k2) out[2] = t(selected.labels.k2);
    if (selected.labels.k3) out[3] = t(selected.labels.k3);
    return out;
  });

  const extras = $derived(
    selected
      ? (['plus', 'minus', 'switch'] as const)
          .filter((slot) => selected!.labels[slot])
          .map((slot) => ({
            slot,
            text: slot === 'switch' ? t(selected!.labels[slot]!) : `${t(`web.slot.${slot}`)}: ${t(selected!.labels[slot]!)}`,
          }))
      : [],
  );

  /** Pull the "[...]" part out of names like "Set as Keyboard [Page Up/Down]". */
  function splitName(name: string): { title: string; context: string } {
    const m = name.match(/^(.*?)[[【]([^\]】]+)[\]】](.*)$/);
    if (!m) return { title: name, context: '' };
    const context = `${m[1]} ${m[3]}`.replace(/\s+/g, ' ').trim();
    return { title: m[2].trim(), context };
  }

  async function apply() {
    if (!selected) return false;
    const ok = await sendAndReport([setPreset(selected.value)], { afterSaveDialog: true });
    if (ok) {
      lastSaved = selected.value;
      save(storeKey, selected.value);
      flash = true;
      setTimeout(() => (flash = false), 950);
    }
    return ok;
  }
</script>

<Page title={t('function.title')} subtitle={t('web.presets.subtitle')}>
  {#snippet stage()}
    <DeviceVisual
      deviceId={def.id}
      {labels}
      {extras}
      {flash}
      placeholder={t('web.presets.pick')}
      ariaLabelFor={(n) => t('scriptPhone.buttonName', { index: n })}
    />
    <ShiftSwitch />
  {/snippet}

  {#snippet actions()}
    <SaveButton onsave={apply} label={t('function.saveBtn')} disabled={!selected || !device.ready} />
  {/snippet}

  <div class="grid" role="radiogroup" aria-label={t('function.title')}>
    {#each def.presets as preset (preset.value)}
      {@const name = splitName(t(preset.nameKey))}
      {@const active = selected === preset}
      <button
        type="button"
        class="preset"
        class:active
        role="radio"
        aria-checked={active}
        onclick={() => (selected = preset)}
      >
        <span class="check" aria-hidden="true"><Icon name="check" size={13} /></span>
        <span class="title">{name.title}</span>
        {#if name.context}<span class="context">{name.context}</span>{/if}
        <span class="caps-row">
          {#each ['k1', 'k2', 'k3'] as const as slot (slot)}
            {#if preset.labels[slot]}
              <span class="keycap">{t(preset.labels[slot]!).split('\n')[0]}</span>
            {/if}
          {/each}
        </span>
        {#if lastSaved === preset.value}
          <span class="tag">{t('web.presets.lastSaved')}</span>
        {/if}
      </button>
    {/each}
  </div>

  {#snippet footnote()}
    <p>{t('common.customFunctionTip')}</p>
    <p>{t('common.customFunctionTip2')}</p>
  {/snippet}
</Page>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
    gap: 12px;
  }

  .preset {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    padding: 16px;
    text-align: left;
    border-radius: var(--r-md);
    border: 1px solid var(--border);
    background: var(--surface);
    box-shadow: var(--inset-highlight);
    transition:
      border-color 120ms var(--ease),
      background 120ms var(--ease),
      transform 120ms var(--ease);
  }

  .preset:hover {
    border-color: var(--border-strong);
  }

  .preset:active {
    transform: scale(0.99);
  }

  .preset.active {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
    background: color-mix(in srgb, var(--accent) 6%, var(--surface));
  }

  .check {
    position: absolute;
    top: 12px;
    right: 12px;
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1.5px solid var(--border-strong);
    color: transparent;
    transition: all 120ms var(--ease);
  }

  .active .check {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--accent-contrast);
  }

  .title {
    font-size: 15px;
    font-weight: 600;
    padding-right: 28px;
    line-height: 1.3;
  }

  .context {
    font-size: 12px;
    color: var(--muted);
    line-height: 1.4;
  }

  .caps-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
  }

  .caps-row .keycap {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 11px;
  }

  .tag {
    position: absolute;
    right: 12px;
    bottom: 12px;
    font-size: 11px;
    font-weight: 600;
    color: var(--success);
  }
</style>
