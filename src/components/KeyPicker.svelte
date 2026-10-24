<script lang="ts">
  import { t } from '../lib/i18n/i18n.svelte';
  import type { Mapping } from '../lib/mapping';
  import type { PhoneAction } from '../lib/protocol/commands';
  import {
    ALL_VIRTUAL_KEYS,
    ARROW_KEYS,
    BOTTOM_ROW,
    FUNCTION_ROW,
    HOME_ROW,
    MAC_KEYS,
    MAX_COMBO_KEYS,
    MEDIA_ROW,
    NAV_KEYS,
    NUMBER_ROW,
    PHONE_ACTIONS,
    SPACE_ROW,
    TOP_ROW,
    comboToEvents,
    normalizeKeyboardEvent,
    type KeyDef,
  } from '../lib/protocol/keys';
  import { toasts } from '../lib/toast.svelte';
  import Icon, { type IconName } from './Icon.svelte';
  import Modal from './Modal.svelte';

  interface Props {
    open: boolean;
    button: number;
    onclose: () => void;
    onpick: (mapping: Mapping) => void;
  }

  let { open, button, onclose, onpick }: Props = $props();

  let mode = $state<'keyboard' | 'phone'>('keyboard');
  let keys = $state<KeyDef[]>([]);
  let action = $state<PhoneAction | null>(null);
  let listening = $state(false);

  $effect(() => {
    if (open) {
      keys = [];
      action = null;
      listening = false;
    }
  });

  const PHONE_ICONS: Record<PhoneAction, IconName> = {
    like: 'like',
    lockscreen: 'lock',
    speed: 'gauge',
    slideleft: 'swipeLeft',
    slideright: 'swipeRight',
    slideup: 'swipeUp',
    slidedown: 'swipeDown',
    pause: 'pause',
    back: 'back',
    home: 'home',
  };

  const MODIFIER_VALUES = ['Control', 'Shift', 'Alt', 'Meta'];
  const isModifier = (key: KeyDef) => MODIFIER_VALUES.some((m) => key.value.startsWith(m));
  /** Modifiers first, the way combos are usually written (Ctrl + C). */
  const trayKeys = $derived([...keys.filter(isModifier), ...keys.filter((k) => !isModifier(k))]);

  const label = (key: KeyDef) => (key.label.startsWith('t:') ? t(key.label.slice(2)) : key.label);
  const isSelected = (key: KeyDef) => keys.some((k) => k.value === key.value);

  function toggle(key: KeyDef) {
    const i = keys.findIndex((k) => k.value === key.value);
    if (i >= 0) {
      keys.splice(i, 1);
      return;
    }
    if (keys.length >= MAX_COMBO_KEYS) {
      toasts.warning(t('keyboard.warning.maxKeys'));
      return;
    }
    keys.push(key);
  }

  function onKeydown(e: KeyboardEvent) {
    if (!open || !listening || mode !== 'keyboard') return;
    e.preventDefault();
    e.stopPropagation();
    if (e.repeat) return;
    const { k } = normalizeKeyboardEvent(e);
    const match = ALL_VIRTUAL_KEYS.find((key) => key.value === k || key.value.toUpperCase() === k.toUpperCase());
    if (match && !isSelected(match)) toggle(match);
  }

  function confirm() {
    if (mode === 'keyboard' && keys.length) onpick({ mode: 'keyboard', events: comboToEvents(keys) });
    else if (mode === 'phone' && action) onpick({ mode: 'phone', action });
    onclose();
  }

  const canConfirm = $derived(mode === 'keyboard' ? keys.length > 0 : action !== null);
</script>

<svelte:window onkeydowncapture={onKeydown} />

{#snippet keyRow(row: KeyDef[], cls = '')}
  <div class="row {cls}">
    {#each row as key (key.value + key.label)}
      <button
        type="button"
        class="key"
        class:wide={key.value === ' '}
        class:selected={isSelected(key)}
        aria-pressed={isSelected(key)}
        onclick={() => toggle(key)}>{label(key)}</button
      >
    {/each}
  </div>
{/snippet}

<Modal {open} {onclose} title={t('web.picker.title', { n: button })} width="900px">
  {#snippet header()}
    <div class="segmented" role="tablist">
      <button role="tab" aria-selected={mode === 'keyboard'} onclick={() => (mode = 'keyboard')}>
        {t('keyboard.mode.keyboard')}
      </button>
      <button role="tab" aria-selected={mode === 'phone'} onclick={() => ((mode = 'phone'), (listening = false))}>
        {t('keyboard.mode.phone')}
      </button>
    </div>
  {/snippet}

  {#if mode === 'keyboard'}
    <div class="tray">
      <div class="slots" aria-live="polite">
        {#each Array.from({ length: MAX_COMBO_KEYS }, (_, i) => i) as i (i)}
          {#if i > 0}<span class="plus">+</span>{/if}
          {#if trayKeys[i]}
            <button class="keycap filled" title={t('web.picker.remove')} onclick={() => toggle(trayKeys[i])}>
              {label(trayKeys[i])}
            </button>
          {:else}
            <span class="slot" aria-hidden="true"></span>
          {/if}
        {/each}
        <span class="count mono">{keys.length}/{MAX_COMBO_KEYS}</span>
      </div>
      <div class="tray-actions">
        <button
          class="btn btn-sm listen"
          class:on={listening}
          aria-pressed={listening}
          onclick={() => (listening = !listening)}
        >
          <span class="rec" aria-hidden="true"></span>
          {listening ? t('web.picker.listening') : t('web.picker.listen')}
        </button>
        <button class="btn btn-ghost btn-sm" onclick={() => (keys = [])} disabled={!keys.length}>
          {t('keyboard.actions.clear')}
        </button>
      </div>
    </div>

    <div class="keyboard">
      <div class="main">
        {@render keyRow(MEDIA_ROW, 'media')}
        {@render keyRow(FUNCTION_ROW, 'fn')}
        {@render keyRow(NUMBER_ROW)}
        {@render keyRow(TOP_ROW)}
        {@render keyRow(HOME_ROW)}
        {@render keyRow(BOTTOM_ROW)}
        {@render keyRow(SPACE_ROW)}
      </div>
      <div class="side">
        <div class="group">
          <span class="caps">{t('keyboard.section.navigation')}</span>
          {@render keyRow(NAV_KEYS, 'grid2')}
        </div>
        <div class="group">
          <span class="caps">{t('keyboard.section.arrow')}</span>
          <div class="arrows">
            {@render keyRow([ARROW_KEYS[0]], 'center')}
            {@render keyRow([ARROW_KEYS[2], ARROW_KEYS[1], ARROW_KEYS[3]], 'center')}
          </div>
        </div>
        <div class="group">
          <span class="caps">{t('keyboard.section.mac')}</span>
          {@render keyRow(MAC_KEYS, 'grid4')}
        </div>
      </div>
    </div>
    <p class="tip">{t('keyboard.tip.keyboard')}</p>
  {:else}
    <div class="phone-grid" role="radiogroup" aria-label={t('keyboard.section.phone')}>
      {#each PHONE_ACTIONS as a (a.value)}
        <button
          type="button"
          class="tile"
          role="radio"
          aria-checked={action === a.value}
          class:selected={action === a.value}
          onclick={() => (action = a.value)}
        >
          <Icon name={PHONE_ICONS[a.value]} size={22} />
          <span>{t(a.labelKey)}</span>
        </button>
      {/each}
    </div>
    <p class="tip">{t('keyboard.tip.phone')} <strong>{t('keyboard.tip.ios')}</strong></p>
  {/if}

  {#snippet footer()}
    <button class="btn" onclick={onclose}>{t('common.cancel')}</button>
    <button class="btn btn-primary" onclick={confirm} disabled={!canConfirm}>{t('keyboard.actions.confirm')}</button>
  {/snippet}
</Modal>

<style>
  .tray {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    padding: 12px;
    margin-bottom: 16px;
    border-radius: var(--r-md);
    background: var(--stage);
    border: 1px solid var(--border);
  }

  .slots {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    min-height: 32px;
  }

  .slot {
    width: 40px;
    height: 28px;
    border-radius: var(--r-xs);
    border: 1.5px dashed var(--border-strong);
  }

  .plus {
    color: var(--subtle);
    font-size: 13px;
  }

  .keycap.filled {
    height: 28px;
    border-color: var(--accent);
    background: var(--accent);
    color: var(--accent-contrast);
    box-shadow: 0 2px 0 color-mix(in srgb, var(--accent) 60%, black);
    cursor: pointer;
  }

  .count {
    margin-left: 6px;
    font-size: 12px;
    color: var(--muted);
  }

  .tray-actions {
    display: flex;
    gap: 6px;
  }

  .listen .rec {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--subtle);
  }

  .listen.on {
    border-color: var(--danger);
    color: var(--danger);
  }

  .listen.on .rec {
    background: var(--danger);
    animation: blink 1s ease-in-out infinite;
  }

  @keyframes blink {
    50% {
      opacity: 0.3;
    }
  }

  .keyboard {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
  }

  .main {
    flex: 1 1 520px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .side {
    flex: 0 1 200px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .row {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .row.media {
    margin-bottom: 4px;
  }

  .row.fn {
    margin-bottom: 4px;
  }

  .row.grid2 {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .row.grid4 {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .row.center {
    justify-content: center;
  }

  .arrows {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .key {
    flex: 1 0 auto;
    min-width: 30px;
    height: 34px;
    padding: 0 6px;
    border-radius: var(--r-xs);
    border: 1px solid var(--border);
    background: var(--surface);
    box-shadow: var(--shadow-key);
    font-family: var(--mono);
    font-size: 12px;
    white-space: nowrap;
    transition:
      transform 80ms var(--ease),
      background 120ms var(--ease);
  }

  .row.center .key {
    flex: 0 0 44px;
  }

  .key:hover {
    border-color: var(--border-strong);
  }

  .key:active {
    transform: translateY(1px);
    box-shadow: none;
  }

  .key.wide {
    flex: 6 0 120px;
  }

  .key.selected {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--accent-contrast);
    box-shadow: 0 2px 0 color-mix(in srgb, var(--accent) 60%, black);
  }

  .phone-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
  }

  .tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px 8px;
    border-radius: var(--r-md);
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--muted);
    font-size: 13px;
    font-weight: 550;
  }

  .tile:hover {
    border-color: var(--border-strong);
    color: var(--text);
  }

  .tile.selected {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
    background: var(--accent-tint);
    color: var(--accent);
  }

  .tip {
    margin-top: 16px;
    font-size: 12px;
    color: var(--muted);
  }
</style>
