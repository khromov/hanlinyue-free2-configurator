<script lang="ts">
  import DeviceVisual, { type Glow } from '../components/DeviceVisual.svelte';
  import Page from '../components/Page.svelte';
  import SaveButton from '../components/SaveButton.svelte';
  import ShiftSwitch from '../components/ShiftSwitch.svelte';
  import { device } from '../lib/device.svelte';
  import { buttonNumbers, type DeviceDef } from '../lib/devices';
  import { t } from '../lib/i18n/i18n.svelte';
  import { setLight, type LightValue } from '../lib/protocol/commands';
  import { sendAndReport } from '../lib/save';
  import { deviceKey, load, save } from '../lib/storage';
  import { toasts } from '../lib/toast.svelte';
  import Icon from '../components/Icon.svelte';

  let { def }: { def: DeviceDef } = $props();

  type ColorMode = 'lucky' | 'rainbow' | 'custom';

  interface KeyLight {
    enable: boolean;
    mode: ColorMode;
    color: string;
    brightness: number;
  }

  const DEFAULT: KeyLight = { enable: false, mode: 'lucky', color: '#ffffff', brightness: 90 };
  const SWATCHES = ['#ffffff', '#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#00c7be', '#0a84ff', '#5e5ce6', '#bf5af2', '#ff2d55'];

  const buttons = $derived(buttonNumbers(def));
  const storeKey = $derived(deviceKey(def.id, 'light'));

  let settings = $state<Record<number, KeyLight>>({});
  let key = $state(1);
  let hex = $state('FFFFFF');
  let hexError = $state(false);
  let flash = $state(false);

  $effect(() => {
    const stored = load<Record<number, KeyLight>>(storeKey, {});
    settings = Object.fromEntries(buttonNumbers(def).map((n) => [n, { ...DEFAULT, ...stored[n] }]));
  });

  const current = $derived(settings[key] ?? DEFAULT);

  $effect(() => {
    hex = current.color.replace('#', '').toUpperCase();
    hexError = false;
  });

  const glows = $derived(
    Object.fromEntries(
      buttons.map((n): [number, Glow] => {
        const s = settings[n];
        if (!s?.enable) return [n, null];
        if (s.mode !== 'custom') return [n, s.mode];
        return [n, withBrightness(s.color, s.brightness)];
      }),
    ),
  );

  function withBrightness(color: string, brightness: number) {
    const alpha = Math.round((0.25 + (brightness / 100) * 0.75) * 255)
      .toString(16)
      .padStart(2, '0');
    return `${color}${alpha}`;
  }

  function update(patch: Partial<KeyLight>) {
    settings[key] = { ...current, ...patch };
  }

  function onHexInput(value: string) {
    const clean = value.replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase();
    hex = clean;
    if (clean.length === 6) {
      hexError = false;
      update({ color: `#${clean.toLowerCase()}` });
    }
  }

  function onHexBlur() {
    if (hex.length === 0) hex = current.color.replace('#', '').toUpperCase();
    else hexError = hex.length !== 6;
  }

  function rgbString(color: string) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    return m ? `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}` : '255,255,255';
  }

  function lightValue(s: KeyLight): LightValue {
    if (!s.enable) return { enable: false };
    if (s.mode === 'lucky') return { enable: true, animate: '1' };
    if (s.mode === 'rainbow') return { enable: true, animate: '2' };
    return { enable: true, rgb: rgbString(s.color), bri: s.brightness };
  }

  async function onsave() {
    // Send every button so the device always matches what the page shows.
    const cmds = buttons.map((n) => setLight(n, lightValue(settings[n] ?? DEFAULT)));
    const ok = await sendAndReport(cmds);
    if (ok) {
      save(storeKey, $state.snapshot(settings));
      toasts.show(t('web.light.replugHint'), 'info', 8000);
      flash = true;
      setTimeout(() => (flash = false), 950);
    }
    return ok;
  }
</script>

<Page title={t('custom.content.light.h1')} subtitle={t('web.light.subtitle')}>
  {#snippet stage()}
    <DeviceVisual
      deviceId={def.id}
      labels={Object.fromEntries(buttons.map((n) => [n, t(`custom.content.light.key${n}`)]))}
      selected={key}
      onselect={(n) => (key = n)}
      {glows}
      {flash}
      ariaLabelFor={(n) => t(`custom.content.light.key${n}`)}
    />
    <ShiftSwitch />
  {/snippet}

  {#snippet actions()}
    <SaveButton {onsave} disabled={!device.ready} label={t('web.light.saveAll')} />
  {/snippet}

  <div class="callout info"><Icon name="info" /><p>{t('web.light.replugHint')}</p></div>

  <section class="card block">
    <div class="line">
      <h3>{t('custom.content.light.selectKey')}</h3>
      <div class="segmented" role="group" aria-label={t('custom.content.light.selectKey')}>
        {#each buttons as n (n)}
          <button type="button" aria-pressed={key === n} onclick={() => (key = n)}>
            {t(`custom.content.light.key${n}`)}
          </button>
        {/each}
      </div>
    </div>
  </section>

  <section class="card block">
    <div class="line">
      <h3>{t('web.light.power')}</h3>
      <label class="switch">
        <input
          type="checkbox"
          role="switch"
          checked={current.enable}
          onchange={(e) => update({ enable: e.currentTarget.checked })}
        />
        <span class="track" aria-hidden="true"><span class="thumb"></span></span>
        <span>{current.enable ? t('web.light.on') : t('web.light.off')}</span>
      </label>
    </div>

    {#if current.enable}
      <div class="field">
        <span class="field-label">{t('custom.content.light.colorMode')}</span>
        <div class="segmented" role="group" aria-label={t('custom.content.light.colorMode')}>
          <button type="button" aria-pressed={current.mode === 'lucky'} onclick={() => update({ mode: 'lucky' })}>
            {t('custom.content.light.luckyColor')}
          </button>
          <button type="button" aria-pressed={current.mode === 'rainbow'} onclick={() => update({ mode: 'rainbow' })}>
            {t('custom.content.light.rainbowColor')}
          </button>
          <button type="button" aria-pressed={current.mode === 'custom'} onclick={() => update({ mode: 'custom' })}>
            {t('custom.content.light.customColor')}
          </button>
        </div>
        <p class="muted hint">{t(`web.light.modeHint.${current.mode}`)}</p>
      </div>

      {#if current.mode === 'custom'}
        <div class="field">
          <span class="field-label">{t('custom.content.light.colorPicker')}</span>
          <div class="swatches">
            {#each SWATCHES as swatch (swatch)}
              <button
                type="button"
                class="swatch"
                class:active={current.color.toLowerCase() === swatch}
                style:--swatch={swatch}
                aria-label={swatch}
                onclick={() => update({ color: swatch })}
              ></button>
            {/each}
            <label class="swatch custom" style:--swatch={current.color} title={t('custom.content.light.customColor')}>
              <input
                type="color"
                value={current.color}
                oninput={(e) => update({ color: e.currentTarget.value })}
                aria-label={t('custom.content.light.colorPicker')}
              />
            </label>
          </div>
          <div class="hex-row">
            <div class="hex" class:error={hexError}>
              <span class="mono">#</span>
              <input
                class="mono"
                value={hex}
                maxlength="7"
                placeholder="FFFFFF"
                aria-label="HEX"
                oninput={(e) => onHexInput(e.currentTarget.value)}
                onblur={onHexBlur}
              />
            </div>
            <span class="muted hint">
              {hexError ? t('custom.content.light.hexFormatError') : t('custom.content.light.hexExample')}
            </span>
          </div>
        </div>

        <div class="field">
          <span class="field-label">{t('custom.content.light.brightness')}</span>
          <div class="slider-row">
            <input
              type="range"
              min="1"
              max="100"
              value={current.brightness}
              style:--fill={current.color}
              oninput={(e) => update({ brightness: Number(e.currentTarget.value) })}
              aria-label={t('custom.content.light.brightness')}
            />
            <span class="mono value">{current.brightness}%</span>
          </div>
        </div>
      {/if}
    {/if}
  </section>
</Page>

<style>
  .block {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .field {
    display: flex;
    flex-direction: column;
  }

  .hint {
    font-size: 12px;
    margin-top: 8px;
  }

  .switch {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-weight: 550;
  }

  .switch input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .track {
    position: relative;
    width: 40px;
    height: 24px;
    border-radius: var(--r-pill);
    background: var(--border-strong);
    transition: background 150ms var(--ease);
  }

  .thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
    transition: transform 150ms var(--ease);
  }

  .switch input:checked + .track {
    background: var(--accent);
  }

  .switch input:checked + .track .thumb {
    transform: translateX(16px);
  }

  .switch input:focus-visible + .track {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .swatch {
    position: relative;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1px solid var(--border-strong);
    background: var(--swatch);
    padding: 0;
    transition: transform 120ms var(--ease);
  }

  .swatch:hover {
    transform: scale(1.08);
  }

  .swatch.active {
    box-shadow:
      0 0 0 2px var(--surface),
      0 0 0 4px var(--accent);
  }

  .swatch.custom {
    cursor: pointer;
    background: conic-gradient(from 0deg, #ff3b30, #ffcc00, #34c759, #0a84ff, #bf5af2, #ff3b30);
  }

  .swatch.custom::after {
    content: '';
    position: absolute;
    inset: 7px;
    border-radius: 50%;
    background: var(--swatch);
    border: 2px solid var(--surface);
  }

  .swatch.custom input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }

  .hex-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
    flex-wrap: wrap;
  }

  .hex {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    height: 36px;
    padding: 0 10px;
    border-radius: var(--r-sm);
    border: 1px solid var(--border);
    background: var(--surface);
  }

  .hex:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-ring);
  }

  .hex.error {
    border-color: var(--danger);
  }

  .hex span {
    color: var(--muted);
  }

  .hex input {
    width: 72px;
    border: 0;
    background: transparent;
    outline: none;
    text-transform: uppercase;
  }

  .hex-row .hint {
    margin: 0;
  }

  .slider-row {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  input[type='range'] {
    flex: 1;
    appearance: none;
    height: 8px;
    border-radius: var(--r-pill);
    background: linear-gradient(to right, #111, var(--fill));
    border: 1px solid var(--border);
  }

  input[type='range']::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid var(--accent);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
    cursor: grab;
  }

  input[type='range']::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid var(--accent);
    cursor: grab;
  }

  .value {
    width: 48px;
    text-align: right;
    font-size: 13px;
  }
</style>
