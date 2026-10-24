<script lang="ts">
  import DeviceVisual from '../components/DeviceVisual.svelte';
  import Icon from '../components/Icon.svelte';
  import Logo from '../components/Logo.svelte';
  import { device, errorMessage, isPickerCancel } from '../lib/device.svelte';
  import { LOCALES, i18n, t, type LocaleId } from '../lib/i18n/i18n.svelte';
  import { isBluetoothSupported } from '../lib/transport/ble';
  import { isSerialSupported } from '../lib/transport/serial';

  const REPO_URL = 'https://github.com/khromov/hanlinyue-free2-configurator';
  const QQ_GROUP = '1038566972';

  const serial = isSerialSupported();
  const bluetooth = isBluetoothSupported();

  let error = $state<string | null>(null);

  const waitingForModel = $derived(device.status === 'connected' && !device.model);
  const busy = $derived(device.status === 'connecting' || waitingForModel);

  async function connect(kind: 'usb' | 'ble') {
    error = null;
    try {
      if (kind === 'usb') await device.connectUsb();
      else await device.connectBle();
    } catch (err) {
      if (isPickerCancel(err)) return;
      const message = errorMessage(err);
      error = /open|busy|in use|access/i.test(message) ? t('web.connect.busy') : t('web.connect.failed', { message });
    }
  }
</script>

<div class="connect">
  <header class="top">
    <Logo />
    <select
      class="select lang"
      value={i18n.locale}
      aria-label={t('more.languageLabel')}
      onchange={(e) => i18n.setLocale(e.currentTarget.value as LocaleId)}
    >
      {#each LOCALES as l (l.id)}
        <option value={l.id}>{l.name}</option>
      {/each}
    </select>
  </header>

  <main class="hero">
    <section class="intro">
      <span class="eyebrow caps">{t('web.connect.eyebrow')}</span>
      {#if device.unsupported}
        <h1>{t('web.unsupported.title')}</h1>
        <p class="lead">{t('web.unsupported.body', { model: device.model })}</p>
        <div class="buttons">
          <a class="btn btn-primary btn-lg" href="{REPO_URL}/issues" target="_blank" rel="noopener noreferrer">
            {t('web.unsupported.report')}<Icon name="external" size={15} />
          </a>
          <button class="btn btn-lg" onclick={() => device.disconnect()}>{t('web.status.disconnect')}</button>
        </div>
      {:else}
        <h1>{t('web.connect.title')}</h1>
        <p class="lead">{t('web.connect.subtitle')}</p>

        {#if !serial && !bluetooth}
          <div class="callout warning" role="alert">
            <Icon name="alert" />
            <div>
              <strong>{t('web.connect.unsupportedTitle')}</strong>
              <p>{t('web.connect.unsupportedBody')}</p>
            </div>
          </div>
        {:else}
          <div class="buttons">
            {#if serial}
              <button class="btn btn-primary btn-lg" onclick={() => connect('usb')} disabled={busy}>
                {#if busy}
                  <span class="spinner" aria-hidden="true"></span>
                  {waitingForModel ? t('web.connect.reading') : t('web.connect.connecting')}
                {:else}
                  <Icon name="usb" />{t('web.connect.usb')}
                {/if}
              </button>
            {/if}
            {#if bluetooth}
              <button class="btn btn-lg" onclick={() => connect('ble')} disabled={busy}>
                <Icon name="bluetooth" />{t('web.connect.ble')}
              </button>
            {/if}
          </div>
          {#if !serial}
            <p class="muted small">{t('web.connect.noSerial')}</p>
          {/if}
          <a class="demo-link small" href="?demo=Free2">{t('web.connect.demo')}</a>
          {#if error}
            <div class="callout warning" role="alert"><Icon name="alert" /><p>{error}</p></div>
          {/if}
        {/if}

        <ol class="steps">
          <li><span class="n mono">1</span>{t('web.connect.step1')}</li>
          <li><span class="n mono">2</span>{t('web.connect.step2')}</li>
          <li><span class="n mono">3</span>{t('web.connect.step3')}</li>
        </ol>
      {/if}
    </section>

    <section class="visual" aria-hidden="true">
      <div class="stage">
        <DeviceVisual deviceId="Free2" dim={device.status !== 'connected'} />
        {#if busy}
          <div class="pulse"></div>
        {/if}
      </div>
    </section>
  </main>

  <section class="help">
    <details>
      <summary>{t('stateMark.usb.title')}</summary>
      <ol>
        <li>{t('stateMark.usb.text1')}</li>
        <li>{t('stateMark.usb.text2')}</li>
        <li>{t('stateMark.usb.text2_1')}</li>
        <li>{t('web.connect.closeOfficial')}</li>
        <li>{t('web.connect.linuxHint')}</li>
        {#if bluetooth}<li>{t('web.connect.bleNote')}</li>{/if}
        <li>{t('stateMark.usb.text3')} <span class="mono">{QQ_GROUP}</span></li>
      </ol>
    </details>
  </section>

  <footer class="foot">
    <span>{t('web.app.disclaimer')}</span>
    <a href={REPO_URL} target="_blank" rel="noopener noreferrer"><Icon name="github" size={14} />GitHub</a>
  </footer>
</div>

<style>
  .connect {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    max-width: 1120px;
    margin: 0 auto;
    padding: 24px 32px;
  }

  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .lang {
    width: auto;
  }

  .hero {
    flex: 1;
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
    gap: 48px;
    align-items: center;
    padding: 48px 0 32px;
  }

  .intro {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
  }

  .eyebrow {
    color: var(--accent);
  }

  h1 {
    font-size: clamp(32px, 4.4vw, 48px);
    line-height: 1.08;
    letter-spacing: -0.03em;
  }

  .lead {
    font-size: 16px;
    color: var(--muted);
    max-width: 48ch;
  }

  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .buttons a.btn {
    text-decoration: none;
  }

  .small {
    font-size: 12px;
  }

  .demo-link {
    align-self: flex-start;
    font-size: 13px;
    font-weight: 550;
  }

  .callout p {
    margin-top: 2px;
  }

  .callout :global(svg) {
    color: var(--warning);
    margin-top: 1px;
  }

  .steps {
    margin: 8px 0 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 52ch;
  }

  .steps li {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    color: var(--muted);
  }

  .n {
    flex: none;
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1px solid var(--border-strong);
    font-size: 12px;
    color: var(--text);
  }

  .visual {
    min-width: 0;
  }

  .stage {
    position: relative;
    display: grid;
    place-items: center;
    min-height: 420px;
    border-radius: var(--r-lg);
    border: 1px solid var(--border);
    background:
      radial-gradient(90% 60% at 50% 30%, var(--stage-glow), transparent 70%),
      var(--stage);
    overflow: hidden;
  }

  .pulse {
    position: absolute;
    width: 260px;
    height: 260px;
    border-radius: 50%;
    border: 2px solid var(--accent);
    animation: radar 1.6s var(--ease) infinite;
    pointer-events: none;
  }

  @keyframes radar {
    from {
      opacity: 0.6;
      transform: scale(0.6);
    }
    to {
      opacity: 0;
      transform: scale(1.3);
    }
  }

  .spinner {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid currentColor;
    border-right-color: transparent;
    animation: spin 700ms linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .help details {
    border-radius: var(--r-md);
    border: 1px solid var(--border);
    background: var(--surface);
    padding: 14px 18px;
  }

  .help summary {
    cursor: pointer;
    font-weight: 600;
  }

  .help ol {
    margin: 12px 0 0;
    padding-left: 20px;
    color: var(--muted);
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
  }

  .foot {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    padding: 24px 0 4px;
    font-size: 12px;
    color: var(--muted);
  }

  .foot a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  @media (max-width: 860px) {
    .hero {
      grid-template-columns: minmax(0, 1fr);
      gap: 28px;
      padding: 28px 0 24px;
    }
    .visual {
      order: -1;
    }
    .stage {
      min-height: 280px;
      padding: 24px 0;
    }
  }

  @media (max-width: 760px) {
    .connect {
      padding: 16px;
    }
    .stage {
      min-height: 0;
      padding: 20px 0;
    }
    .stage :global(.art) {
      width: 96px;
    }
    .buttons .btn {
      flex: 1 1 100%;
    }
  }
</style>
