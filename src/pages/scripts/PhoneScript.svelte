<script lang="ts">
  import DeviceVisual from '../../components/DeviceVisual.svelte';
  import LayerPicker from '../../components/LayerPicker.svelte';
  import Page from '../../components/Page.svelte';
  import RepeatPicker from '../../components/RepeatPicker.svelte';
  import SaveButton from '../../components/SaveButton.svelte';
  import ShiftSwitch from '../../components/ShiftSwitch.svelte';
  import { device } from '../../lib/device.svelte';
  import { buttonNumbers, type DeviceDef } from '../../lib/devices';
  import { t } from '../../lib/i18n/i18n.svelte';
  import { setMouse, type Layer, type PhoneAction, type Repeat } from '../../lib/protocol/commands';
  import { SCRIPT_PHONE_ACTIONS } from '../../lib/protocol/keys';
  import { sendAndReport } from '../../lib/save';
  import { deviceKey, load, save } from '../../lib/storage';
  import { toasts } from '../../lib/toast.svelte';

  let { def }: { def: DeviceDef } = $props();

  interface Stored {
    chosen: Partial<Record<number, PhoneAction>>;
    repeat: Repeat;
  }

  const storeKey = $derived(deviceKey(def.id, 'phone-script'));
  const buttons = $derived(buttonNumbers(def));

  let chosen = $state<Stored['chosen']>({});
  let repeat = $state<Repeat>(1);
  let layer = $state<Layer>('click');
  let focused = $state<number | null>(null);
  let selects: Record<number, HTMLSelectElement> = {};

  $effect(() => {
    const stored = load<Stored | null>(storeKey, null);
    chosen = stored?.chosen ?? {};
    repeat = stored?.repeat ?? 1;
  });

  const labelFor = (action: PhoneAction | undefined) =>
    action ? t(SCRIPT_PHONE_ACTIONS.find((a) => a.value === action)?.labelKey ?? action) : '';

  const labels = $derived(Object.fromEntries(buttons.map((n) => [n, labelFor(chosen[n])])) as Record<number, string>);

  async function onsave() {
    const cmds = buttons.flatMap((n) => {
      const action = chosen[n];
      return action ? [setMouse(n, layer, action, repeat)] : [];
    });
    if (!cmds.length) {
      toasts.warning(t('scriptPhone.needSelectKey'));
      return false;
    }
    save(storeKey, { chosen: { ...chosen }, repeat });
    return sendAndReport(cmds, { afterSaveDialog: true });
  }
</script>

<Page title={t('web.scripts.phoneTitle')} subtitle={t('scriptPhone.describe')}>
  {#snippet stage()}
    <DeviceVisual
      deviceId={def.id}
      {labels}
      placeholder={t('scriptPhone.placeholder')}
      selected={focused}
      onselect={(n) => selects[n]?.focus()}
      ariaLabelFor={(n) => t('scriptPhone.buttonName', { index: n })}
    />
    <ShiftSwitch />
  {/snippet}

  {#snippet actions()}
    <SaveButton {onsave} disabled={!device.ready} />
  {/snippet}

  <LayerPicker bind:value={layer} />

  <section class="card block">
    <h3>{t('web.scripts.actionPerButton')}</h3>
    {#each buttons as n (n)}
      <label class="row">
        <span class="num mono">{n}</span>
        <span class="name">{t('scriptPhone.buttonName', { index: n })}</span>
        <select
          class="select"
          bind:this={selects[n]}
          value={chosen[n] ?? ''}
          onfocus={() => (focused = n)}
          onblur={() => (focused = null)}
          onchange={(e) => {
            const v = e.currentTarget.value as PhoneAction | '';
            if (v) chosen[n] = v;
            else delete chosen[n];
          }}
        >
          <option value="">{t('web.scripts.noAction')}</option>
          {#each SCRIPT_PHONE_ACTIONS as a (a.value)}
            <option value={a.value}>{t(a.labelKey)}</option>
          {/each}
        </select>
      </label>
    {/each}
    <p class="muted hint">{t('keyboard.tip.ios')}</p>
  </section>

  <RepeatPicker bind:value={repeat} />
</Page>

<style>
  .block {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .num {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 7px;
    background: var(--stage);
    font-size: 12px;
    color: var(--muted);
    flex: none;
  }

  .name {
    flex: 1;
    font-weight: 550;
  }

  .select {
    width: min(220px, 50%);
  }

  .hint {
    font-size: 12px;
  }
</style>
