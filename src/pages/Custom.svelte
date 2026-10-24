<script lang="ts">
  import DeviceVisual from '../components/DeviceVisual.svelte';
  import Icon from '../components/Icon.svelte';
  import KeyPicker from '../components/KeyPicker.svelte';
  import LayerPicker from '../components/LayerPicker.svelte';
  import Page from '../components/Page.svelte';
  import SaveButton from '../components/SaveButton.svelte';
  import ShiftSwitch from '../components/ShiftSwitch.svelte';
  import { device } from '../lib/device.svelte';
  import { buttonNumbers, type DeviceDef } from '../lib/devices';
  import { t } from '../lib/i18n/i18n.svelte';
  import { describeMapping, emptyLayers, layerCommands, plain, type LayerMap, type Mapping } from '../lib/mapping';
  import type { Layer } from '../lib/protocol/commands';
  import { keyLabel } from '../lib/protocol/keys';
  import { sendAndReport } from '../lib/save';
  import { deviceKey, load, save } from '../lib/storage';
  import { toasts } from '../lib/toast.svelte';

  let { def }: { def: DeviceDef } = $props();

  interface Stored {
    layers: LayerMap;
    profiles: Partial<Record<1 | 2 | 3, LayerMap>>;
  }

  const storeKey = $derived(deviceKey(def.id, 'custom'));
  const buttons = $derived(buttonNumbers(def));

  let layers = $state<LayerMap>(emptyLayers());
  let profiles = $state<Stored['profiles']>({});
  let activeProfile = $state<0 | 1 | 2 | 3>(0);
  let layer = $state<Layer>('click');
  let selected = $state<number | null>(null);
  let pickerOpen = $state(false);
  let flash = $state(false);

  $effect(() => {
    const stored = load<Stored | null>(storeKey, null);
    layers = { ...emptyLayers(), ...(stored?.layers ?? {}) };
    profiles = stored?.profiles ?? {};
  });

  const persist = () => save(storeKey, plain({ layers, profiles }));

  const labels = $derived(
    Object.fromEntries(buttons.map((n) => [n, describeMapping(layers[layer][n], t)])) as Record<number, string>,
  );

  function openPicker(n: number) {
    selected = n;
    pickerOpen = true;
  }

  function onpick(mapping: Mapping) {
    if (selected === null) return;
    layers[layer][selected] = mapping;
    persist();
  }

  function clear(n: number) {
    delete layers[layer][n];
    persist();
  }

  function selectProfile(n: 1 | 2 | 3) {
    if (activeProfile === n) {
      activeProfile = 0;
      return;
    }
    activeProfile = n;
    const stored = profiles[n];
    if (stored) layers = { ...emptyLayers(), ...plain(stored) };
  }

  async function onsave() {
    const cmds = layerCommands(layers, buttons);
    if (!cmds.length) {
      toasts.warning(t('web.custom.nothingToSave'));
      return false;
    }
    if (activeProfile) profiles[activeProfile] = plain(layers);
    persist();
    const ok = await sendAndReport(cmds, { afterSaveDialog: true });
    if (ok) {
      flash = true;
      setTimeout(() => (flash = false), 950);
    }
    return ok;
  }

  function keycaps(mapping: Mapping): string[] {
    if (mapping.mode === 'phone') return [describeMapping(mapping, t)];
    const keys: string[] = [];
    for (const e of mapping.events) if (e.t === 'down' && !keys.includes(e.k)) keys.push(e.k);
    return keys.map((k) => keyLabel(k, t));
  }
</script>

<Page title={t('custom.header.h1')} subtitle={t('web.custom.subtitle')}>
  {#snippet stage()}
    <DeviceVisual
      deviceId={def.id}
      {labels}
      {flash}
      placeholder={t('custom.keyRecorderPlaceholder')}
      {selected}
      onselect={openPicker}
      ariaLabelFor={(n) => `${t('scriptPhone.buttonName', { index: n })}: ${labels[n] || t('custom.keyRecorderPlaceholder')}`}
    />
    <ShiftSwitch />
  {/snippet}

  {#snippet actions()}
    <SaveButton
      {onsave}
      disabled={!device.ready}
      label={activeProfile ? t('web.custom.saveProfile', { n: activeProfile }) : t('common.save')}
    />
  {/snippet}

  <LayerPicker bind:value={layer} />

  <section class="card block">
    <h3>{t('web.custom.buttons')}</h3>
    <ul class="rows">
      {#each buttons as n (n)}
        {@const mapping = layers[layer][n]}
        <li class="row" class:selected={selected === n && pickerOpen}>
          <span class="num mono">{n}</span>
          <div class="value">
            {#if mapping}
              <span class="kind">
                <Icon name={mapping.mode === 'phone' ? 'phone' : 'keyboard'} size={14} />
              </span>
              <span class="caps-list">
                {#each keycaps(mapping) as cap, i (i)}
                  {#if i > 0}<span class="plus">+</span>{/if}
                  <span class="keycap">{cap}</span>
                {/each}
              </span>
            {:else}
              <span class="muted">{t('web.custom.notSet')}</span>
            {/if}
          </div>
          <div class="row-actions">
            <button class="btn btn-sm" onclick={() => openPicker(n)}>
              {mapping ? t('web.custom.change') : t('web.custom.choose')}
            </button>
            {#if mapping}
              <button class="btn btn-sm btn-danger-text" onclick={() => clear(n)} aria-label={t('web.custom.clear')}>
                <Icon name="trash" size={15} />
              </button>
            {/if}
          </div>
        </li>
      {/each}
    </ul>
  </section>

  <section class="card block">
    <div class="profiles-head">
      <h3>{t('web.custom.profiles')}</h3>
      <div class="segmented" role="group" aria-label={t('web.custom.profiles')}>
        {#each [1, 2, 3] as const as n (n)}
          <button type="button" aria-pressed={activeProfile === n} onclick={() => selectProfile(n)}>
            {t('web.custom.profile', { n })}
          </button>
        {/each}
      </div>
    </div>
    <p class="muted hint">{t('web.custom.profilesHint')}</p>
  </section>

  {#snippet footnote()}
    <p>{t('common.customFunctionTip')}</p>
    <p>{t('common.customFunctionTip2')}</p>
  {/snippet}
</Page>

<KeyPicker open={pickerOpen} button={selected ?? 1} onclose={() => (pickerOpen = false)} {onpick} />

<style>
  .block {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .rows {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    border-top: 1px solid var(--border);
  }

  .row:first-child {
    border-top: 0;
    padding-top: 0;
  }

  .num {
    flex: none;
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 7px;
    background: var(--stage);
    font-size: 12px;
    color: var(--muted);
  }

  .value {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex-wrap: wrap;
  }

  .kind {
    display: flex;
    color: var(--muted);
  }

  .caps-list {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
  }

  .plus {
    color: var(--subtle);
    font-size: 12px;
  }

  .row-actions {
    display: flex;
    gap: 4px;
    flex: none;
  }

  .profiles-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .hint {
    font-size: 13px;
  }
</style>
