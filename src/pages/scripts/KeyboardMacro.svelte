<script lang="ts">
  import DeviceVisual from '../../components/DeviceVisual.svelte';
  import Icon from '../../components/Icon.svelte';
  import LayerPicker from '../../components/LayerPicker.svelte';
  import Page from '../../components/Page.svelte';
  import RepeatPicker from '../../components/RepeatPicker.svelte';
  import SaveButton from '../../components/SaveButton.svelte';
  import ShiftSwitch from '../../components/ShiftSwitch.svelte';
  import { device } from '../../lib/device.svelte';
  import { buttonNumbers, type DeviceDef } from '../../lib/devices';
  import { t } from '../../lib/i18n/i18n.svelte';
  import { plain } from '../../lib/mapping';
  import {
    MACRO_LIMIT_KB,
    commandSizeKb,
    setAllWaits,
    setKeyboard,
    type KeyEvent,
    type Layer,
    type Repeat,
  } from '../../lib/protocol/commands';
  import { keyLabel } from '../../lib/protocol/keys';
  import { MacroRecorder } from '../../lib/recorder';
  import { sendAndReport } from '../../lib/save';
  import { deviceKey, load, save } from '../../lib/storage';
  import { toasts } from '../../lib/toast.svelte';

  let { def }: { def: DeviceDef } = $props();

  type DelayMode = 'record' | 'default' | 'fixed';

  const draftKey = $derived(deviceKey(def.id, 'macro-draft'));
  const buttons = $derived(buttonNumbers(def));

  let recorded = $state<KeyEvent[]>([]);
  let recording = $state(false);
  let live = $state<KeyEvent[]>([]);
  let elapsed = $state(0);
  let delayMode = $state<DelayMode>('record');
  let fixedMs = $state(30);
  let repeat = $state<Repeat>(1);
  let layer = $state<Layer>('click');
  let target = $state(1);
  let flash = $state(false);

  let recorder: MacroRecorder | null = null;
  let startedAt = 0;
  let tick: ReturnType<typeof setInterval> | undefined;

  $effect(() => {
    recorded = load<KeyEvent[]>(draftKey, []);
  });

  const finalEvents = $derived(
    delayMode === 'record'
      ? recorded
      : setAllWaits(recorded, delayMode === 'default' ? 30 : Math.max(1, Math.round(fixedMs) || 1)),
  );
  const shown = $derived(recording ? live : finalEvents);
  const hasMacro = $derived(recorded.some((e) => e.t !== 'wait'));

  function onKeydown(e: KeyboardEvent) {
    if (!recording || !recorder) return;
    e.preventDefault();
    recorder.keydown(e);
    live = [...recorder.events];
  }

  function onKeyup(e: KeyboardEvent) {
    if (!recording || !recorder) return;
    e.preventDefault();
    recorder.keyup(e);
    live = [...recorder.events];
  }

  function start() {
    recorder = new MacroRecorder();
    live = [];
    recording = true;
    startedAt = performance.now();
    elapsed = 0;
    tick = setInterval(() => (elapsed = performance.now() - startedAt), 100);
  }

  function stop() {
    if (!recorder) return;
    clearInterval(tick);
    const events = recorder.finish();
    recorder = null;
    recording = false;
    if (!events.some((e) => e.t === 'down' || e.t === 'up')) {
      toasts.warning(t('script.noKeyEvents'));
      return;
    }
    recorded = plain(events);
    save(draftKey, recorded);
  }

  function clear() {
    recorded = [];
    save(draftKey, []);
    toasts.success(t('script.macroCleared'));
  }

  function describe(e: KeyEvent): string {
    if (e.t === 'wait') return t('script.event.wait', { ms: e.ms });
    return t(e.t === 'down' ? 'script.event.keyDown' : 'script.event.keyUp', { key: keyLabel(e.k, t) });
  }

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}.${Math.floor((ms % 1000) / 100)}`;
  };

  async function onsave() {
    const cmd = setKeyboard(target, layer, plain(finalEvents), repeat);
    const size = commandSizeKb(cmd);
    if (size > MACRO_LIMIT_KB) {
      toasts.error(t('script.commandSizeExceeded', { size: size.toFixed(2), limit: MACRO_LIMIT_KB }));
      return false;
    }
    const ok = await sendAndReport([cmd], { afterSaveDialog: true });
    if (ok) {
      flash = true;
      setTimeout(() => (flash = false), 950);
    }
    return ok;
  }
</script>

<svelte:window onkeydown={onKeydown} onkeyup={onKeyup} onblur={() => recording && stop()} />

<Page title={t('web.scripts.keyboardTitle')} subtitle={t('script.describe')}>
  {#snippet stage()}
    <DeviceVisual
      deviceId={def.id}
      labels={Object.fromEntries(buttons.map((n) => [n, n === target ? t('web.scripts.saveTarget') : '']))}
      placeholder=" "
      selected={target}
      {flash}
      onselect={(n) => (target = n)}
      ariaLabelFor={(n) => t('script.saveToKey', { keyNumber: n })}
    />
    <ShiftSwitch />
  {/snippet}

  {#snippet actions()}
    <SaveButton
      {onsave}
      disabled={!device.ready || !hasMacro || recording}
      label={t('web.scripts.saveTo', { n: target })}
    />
  {/snippet}

  <LayerPicker bind:value={layer} />

  <section class="card block">
    <div class="step-head">
      <span class="step mono">1</span>
      <h3>{t('script.macroSetting')}</h3>
      <div class="head-actions">
        {#if hasMacro && !recording}
          <button class="btn btn-sm btn-danger-text" onclick={clear}>{t('script.clear')}</button>
        {/if}
        {#if recording}
          <span class="timer mono"><span class="rec-dot"></span>{formatTime(elapsed)}</span>
          <button class="btn btn-sm" onclick={stop}><Icon name="stop" size={14} />{t('script.stopRecording')}</button>
        {:else}
          <button class="btn btn-sm btn-primary" onclick={start}>
            <Icon name="record" size={14} />{t('web.scripts.record')}
          </button>
        {/if}
      </div>
    </div>

    <div class="timeline" class:recording aria-live="polite">
      {#if shown.length}
        {#each shown as e, i (i)}
          <span class="chip {e.t}" title={describe(e)}>
            {#if e.t === 'wait'}
              <Icon name="clock" size={12} /><span class="mono">{e.ms} ms</span>
            {:else}
              <Icon name={e.t === 'down' ? 'arrowDown' : 'arrowUp'} size={12} />
              <span class="mono">{keyLabel(e.k, t)}</span>
            {/if}
          </span>
        {/each}
      {:else}
        <p class="empty muted">{recording ? t('script.recordTipPressKey') : t('web.scripts.recordHint')}</p>
      {/if}
    </div>
  </section>

  {#if hasMacro && !recording}
    <section class="card block">
      <div class="step-head">
        <span class="step mono">2</span>
        <h3>{t('script.delaySetting')}</h3>
      </div>
      <div class="options" role="radiogroup" aria-label={t('script.delaySetting')}>
        <label class="option" class:active={delayMode === 'record'}>
          <input type="radio" name="delay" checked={delayMode === 'record'} onchange={() => (delayMode = 'record')} />
          <span class="text"><strong>{t('script.recordDelay')}</strong><small>{t('script.recordTip')}</small></span>
        </label>
        <label class="option" class:active={delayMode === 'default'}>
          <input type="radio" name="delay" checked={delayMode === 'default'} onchange={() => (delayMode = 'default')} />
          <span class="text"><strong>{t('script.defaultDelay')}</strong><small>{t('script.defaultTip')}</small></span>
        </label>
        <label class="option" class:active={delayMode === 'fixed'}>
          <input type="radio" name="delay" checked={delayMode === 'fixed'} onchange={() => (delayMode = 'fixed')} />
          <span class="text">
            <strong>{t('script.fixedDelay')}</strong>
            <span class="fixed">
              <input
                class="input mono"
                type="number"
                min="1"
                bind:value={fixedMs}
                onfocus={() => (delayMode = 'fixed')}
                aria-label={t('script.tPlaceholder')}
              />
              <small>{t('script.milliseconds')}</small>
            </span>
          </span>
        </label>
      </div>
    </section>

    <RepeatPicker bind:value={repeat} />

    <section class="card block">
      <div class="step-head">
        <span class="step mono">3</span>
        <h3>{t('script.tip3')}</h3>
      </div>
      <div class="segmented" role="group" aria-label={t('script.tip3')}>
        {#each buttons as n (n)}
          <button type="button" aria-pressed={target === n} onclick={() => (target = n)}>
            {t('script.saveToKey', { keyNumber: n })}
          </button>
        {/each}
      </div>
    </section>
  {/if}
</Page>

<style>
  .block {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .step-head {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .step {
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--accent-tint);
    color: var(--accent);
    font-size: 12px;
    font-weight: 600;
    flex: none;
  }

  .head-actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .timer {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--danger);
  }

  .rec-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--danger);
    animation: pulse 1s ease-in-out infinite;
  }

  @keyframes pulse {
    50% {
      opacity: 0.25;
      transform: scale(0.8);
    }
  }

  .timeline {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    min-height: 88px;
    max-height: 320px;
    overflow: auto;
    padding: 12px;
    border-radius: var(--r-sm);
    background: var(--stage);
    border: 1px dashed var(--border-strong);
    align-content: flex-start;
  }

  .timeline.recording {
    border-color: var(--danger);
    border-style: solid;
  }

  .empty {
    margin: auto;
    font-size: 13px;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 26px;
    padding: 0 9px;
    border-radius: var(--r-pill);
    font-size: 12px;
    animation: pop 140ms var(--ease);
  }

  .chip.down {
    background: var(--accent-tint);
    color: var(--accent);
  }

  .chip.up {
    border: 1px solid var(--border-strong);
    color: var(--text);
  }

  .chip.wait {
    background: var(--surface);
    color: var(--muted);
  }

  @keyframes pop {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
  }

  .options {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .option {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px;
    border-radius: var(--r-sm);
    border: 1px solid var(--border);
    cursor: pointer;
  }

  .option.active {
    border-color: var(--accent);
    background: var(--accent-tint);
  }

  .option input[type='radio'] {
    margin: 3px 0 0;
    accent-color: var(--accent);
  }

  .text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }

  .text small {
    color: var(--muted);
    font-size: 12px;
  }

  .fixed {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
  }

  .fixed .input {
    width: 96px;
  }
</style>
