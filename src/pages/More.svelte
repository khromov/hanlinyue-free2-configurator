<script lang="ts">
  import Battery from '../components/Battery.svelte';
  import Icon from '../components/Icon.svelte';
  import Page from '../components/Page.svelte';
  import { device } from '../lib/device.svelte';
  import type { DeviceDef } from '../lib/devices';
  import { LOCALES, i18n, t, type LocaleId } from '../lib/i18n/i18n.svelte';
  import { theme, type Theme } from '../lib/theme.svelte';

  let { def }: { def: DeviceDef } = $props();

  const FIRMWARE_URL = 'https://hanlinyue.com.cn/1755601629014';
  const SUPPORT_EMAIL = 'hly@hanlinyue.com.cn';
  const REPO_URL = 'https://github.com/khromov/hanlinyue-free2-configurator';

  const info = (field: string) => i18n.maybe(`about.deviceInfo.${def.id}.${field}`);

  const specs = $derived(
    (
      [
        ['deviceName', info('deviceName')],
        ['model', info('model')],
        ['bluetoothVersion', info('bluetoothVersion')],
        ['transmitPower', info('transmitPower')],
        ['frequency', info('frequency')],
        ['communicationDistance', info('communicationDistance')],
        ['batteryCapacity', info('batteryCapacity')],
        ['execStandard', info('execStandard')],
        ['cmiitID', info('cmiitID')],
        ['manufacturer', info('manufacturer')],
        ['origin', info('origin')],
      ] as const
    ).filter(([, v]) => !!v),
  );

  let logEl: HTMLElement | undefined = $state();
  let logOpen = $state(false);

  $effect(() => {
    void device.log.length;
    if (logOpen && logEl) logEl.scrollTop = logEl.scrollHeight;
  });

  const time = (ms: number) => new Date(ms).toLocaleTimeString([], { hour12: false });
</script>

<Page title={t('more.h1')}>
  <div class="cols">
    <section class="card block">
      <div class="head">
        <h3>{t('about.deviceInfo.h2')}</h3>
        <span class="live"><span class="dot"></span>{t('sidebar.device.title')}</span>
      </div>
      <dl class="kv">
        <div><dt>{t('sidebar.device.connectType')}</dt><dd>{device.kind === 'ble' ? t('web.status.ble') : t('web.status.usb')}</dd></div>
        <div><dt>{t('about.deviceInfo.remainingBattery')}</dt><dd><Battery level={device.battery} /></dd></div>
        <div><dt>{t('sidebar.device.firmware')}</dt><dd class="mono">{device.firmware || '—'}</dd></div>
        <div><dt>{t('sidebar.device.mac')}</dt><dd class="mono">{device.mac || '—'}</dd></div>
        <div><dt>{t('web.more.reportedModel')}</dt><dd class="mono">{device.model}</dd></div>
        {#each specs as [field, value] (field)}
          <div><dt>{t(`about.deviceInfo.${field}`)}</dt><dd>{value}</dd></div>
        {/each}
      </dl>
      <div class="row-actions">
        <button class="btn btn-sm" onclick={() => device.requestInfo()}>{t('web.more.refresh')}</button>
        <button class="btn btn-sm btn-ghost" onclick={() => device.disconnect()}>
          <Icon name="unplug" size={15} />{t('web.status.disconnect')}
        </button>
      </div>
    </section>

    <div class="stack">
      <section class="card block">
        <h3>{t('more.firmwareLabel')}</h3>
        <dl class="kv">
          <div><dt>{t('more.deviceFirmwareVersion')}</dt><dd class="mono">{device.firmware || '—'}</dd></div>
        </dl>
        <p class="muted small">{t('web.more.firmwareNote')}</p>
        <div class="row-actions">
          <a class="btn btn-sm" href={FIRMWARE_URL} target="_blank" rel="noopener noreferrer">
            {t('more.downloadFirmware')}<Icon name="external" size={14} />
          </a>
          <a class="btn btn-sm btn-ghost" href="mailto:{SUPPORT_EMAIL}">{SUPPORT_EMAIL}</a>
        </div>
      </section>

      <section class="card block">
        <h3>{t('web.more.preferences')}</h3>
        <label class="pref">
          <span><Icon name="globe" size={16} />{t('more.languageLabel')}</span>
          <select
            class="select"
            value={i18n.locale}
            onchange={(e) => i18n.setLocale(e.currentTarget.value as LocaleId)}
          >
            {#each LOCALES as l (l.id)}
              <option value={l.id}>{l.name}</option>
            {/each}
          </select>
        </label>
        <div class="pref">
          <span><Icon name={theme.value === 'dark' ? 'moon' : 'sun'} size={16} />{t('web.more.appearance')}</span>
          <div class="segmented" role="group" aria-label={t('web.more.appearance')}>
            {#each ['system', 'light', 'dark'] as const as value (value)}
              <button type="button" aria-pressed={theme.value === value} onclick={() => theme.set(value as Theme)}>
                {t(`web.more.theme.${value}`)}
              </button>
            {/each}
          </div>
        </div>
        <a class="pref link" href={t('specification.link')} target="_blank" rel="noopener noreferrer">
          <span><Icon name="book" size={16} />{t('web.more.manual')}</span>
          <Icon name="external" size={14} />
        </a>
      </section>
    </div>
  </div>

  <section class="card block">
    <button class="log-toggle" aria-expanded={logOpen} onclick={() => (logOpen = !logOpen)}>
      <span><Icon name="terminal" size={16} /><strong>{t('web.more.log')}</strong></span>
      <span class="muted small">{logOpen ? t('web.more.hide') : t('web.more.show')}</span>
    </button>
    {#if logOpen}
      <p class="muted small">{t('web.more.logHint')}</p>
      <div class="log mono" bind:this={logEl}>
        {#each device.log as entry (entry.id)}
          <div class="entry {entry.dir}">
            <span class="time">{time(entry.time)}</span>
            <span class="dir">{entry.dir.toUpperCase()}</span>
            <span class="text">{entry.text}</span>
          </div>
        {:else}
          <p class="muted">—</p>
        {/each}
      </div>
      <div class="row-actions">
        <button class="btn btn-sm" onclick={() => navigator.clipboard?.writeText(device.log.map((e) => `${time(e.time)} ${e.dir.toUpperCase()} ${e.text}`).join('\n'))}>
          {t('web.more.copyLog')}
        </button>
        <button class="btn btn-sm btn-ghost" onclick={() => device.clearLog()}>{t('web.more.clearLog')}</button>
      </div>
    {/if}
  </section>

  <section class="about">
    <p>{t('web.more.about')}</p>
    <a href={REPO_URL} target="_blank" rel="noopener noreferrer"><Icon name="github" size={15} />{t('web.more.source')}</a>
  </section>
</Page>

<style>
  .cols {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
    gap: 16px;
    align-items: start;
  }

  .stack {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .block {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .live {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--success);
    font-weight: 550;
  }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
  }

  .kv {
    margin: 0;
    display: flex;
    flex-direction: column;
  }

  .kv div {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 16px;
    padding: 8px 0;
    border-top: 1px solid var(--border);
    font-size: 13px;
  }

  .kv div:first-child {
    border-top: 0;
  }

  .kv dt {
    color: var(--muted);
    flex: none;
  }

  .kv dd {
    margin: 0;
    text-align: right;
    overflow-wrap: anywhere;
  }

  .small {
    font-size: 12px;
  }

  .row-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .row-actions a.btn {
    text-decoration: none;
  }

  .pref {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    padding: 8px 0;
    border-top: 1px solid var(--border);
    color: var(--text);
  }

  .block h3 + .pref {
    border-top: 0;
  }

  .pref > span {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 550;
  }

  .pref.link {
    text-decoration: none;
  }

  .pref.link:hover {
    color: var(--accent);
  }

  .select {
    min-width: 160px;
  }

  .log-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 0;
    padding: 0;
    background: transparent;
    text-align: left;
  }

  .log-toggle span {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .log {
    max-height: 280px;
    overflow: auto;
    padding: 10px 12px;
    border-radius: var(--r-sm);
    background: var(--stage);
    border: 1px solid var(--border);
    font-size: 11.5px;
    line-height: 1.6;
  }

  .entry {
    display: flex;
    gap: 10px;
  }

  .time {
    color: var(--subtle);
    flex: none;
  }

  .dir {
    flex: none;
    width: 40px;
    font-weight: 600;
  }

  .tx .dir {
    color: var(--accent);
  }
  .rx .dir {
    color: var(--success);
  }
  .error .dir {
    color: var(--danger);
  }
  .info .dir {
    color: var(--muted);
  }

  .text {
    overflow-wrap: anywhere;
  }

  .about {
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 12px;
    color: var(--muted);
    max-width: 70ch;
  }

  .about a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 550;
  }
</style>
