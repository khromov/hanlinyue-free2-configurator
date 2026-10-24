<script lang="ts">
  import { device } from '../lib/device.svelte';
  import { t } from '../lib/i18n/i18n.svelte';
  import { router, type Route } from '../lib/router.svelte';
  import Battery from './Battery.svelte';
  import Icon, { type IconName } from './Icon.svelte';
  import Logo from './Logo.svelte';

  const items = $derived(
    [
      { route: 'presets', icon: 'presets', label: t('sidebar.function'), short: t('web.nav.presets') },
      { route: 'custom', icon: 'custom', label: t('sidebar.custom'), short: t('web.nav.custom') },
      { route: 'scripts', icon: 'scripts', label: t('sidebar.script'), short: t('web.nav.scripts') },
      ...(device.device?.hasLight
        ? [{ route: 'light', icon: 'light', label: t('sidebar.light'), short: t('web.nav.light') }]
        : []),
      { route: 'more', icon: 'more', label: t('sidebar.more'), short: t('web.nav.more') },
    ] as { route: Route; icon: IconName; label: string; short: string }[],
  );
</script>

<aside class="sidebar">
  <div class="brand"><Logo /></div>

  <nav aria-label={t('web.nav.label')}>
    {#each items as item (item.route)}
      <a
        href="#/{item.route}"
        class="nav-item"
        aria-current={router.current === item.route ? 'page' : undefined}
      >
        <Icon name={item.icon} />
        <span>{item.label}</span>
      </a>
    {/each}
  </nav>

  <section class="status card" aria-label={t('sidebar.device.title')}>
    <div class="status-head">
      <span class="dot" aria-hidden="true"></span>
      <div class="model">
        <strong>{device.device?.displayName ?? device.model}</strong>
        <span class="muted">{t('sidebar.device.title')}</span>
      </div>
      <span class="badge" class:demo={device.demo}>
        <Icon name={device.kind === 'ble' ? 'bluetooth' : 'usb'} size={13} />
        {device.demo ? t('web.status.demo') : device.kind === 'ble' ? t('web.status.ble') : t('web.status.usb')}
      </span>
    </div>
    <dl>
      <div>
        <dt>{t('sidebar.device.power')}</dt>
        <dd><Battery level={device.battery} /></dd>
      </div>
      <div>
        <dt>{t('sidebar.device.firmware')}</dt>
        <dd class="mono">{device.firmware || '—'}</dd>
      </div>
      <div>
        <dt>{t('sidebar.device.mac')}</dt>
        <dd class="mono sn">{device.mac || '—'}</dd>
      </div>
    </dl>
    <button class="btn btn-ghost btn-sm disconnect" onclick={() => device.disconnect()}>
      <Icon name="unplug" size={15} />
      {t('web.status.disconnect')}
    </button>
  </section>
</aside>

<!-- Phone: compact top bar + bottom tabs -->
<header class="topbar">
  <Logo compact />
  <a class="chip" href="#/more">
    <span class="dot" aria-hidden="true"></span>
    <strong>{device.device?.displayName ?? device.model}</strong>
    <Battery level={device.battery} />
  </a>
</header>

<nav class="tabs" aria-label={t('web.nav.label')}>
  {#each items as item (item.route)}
    <a href="#/{item.route}" aria-current={router.current === item.route ? 'page' : undefined}>
      <Icon name={item.icon} size={20} />
      <span>{item.short}</span>
    </a>
  {/each}
</nav>

<style>
  .sidebar {
    position: sticky;
    top: 0;
    height: 100dvh;
    width: 248px;
    flex: none;
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 22px 16px 16px;
    border-right: 1px solid var(--border);
    background: var(--surface);
  }

  .brand {
    padding: 0 8px;
  }

  .sidebar nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 40px;
    padding: 0 12px;
    border-radius: var(--r-sm);
    color: var(--muted);
    font-weight: 550;
    text-decoration: none;
    transition:
      background 120ms var(--ease),
      color 120ms var(--ease);
  }

  .nav-item:hover {
    background: var(--bg);
    color: var(--text);
    text-decoration: none;
  }

  .nav-item[aria-current='page'] {
    background: var(--accent-tint);
    color: var(--accent);
  }

  .status {
    margin-top: auto;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: var(--bg);
  }

  .status-head {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--success);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--success) 20%, transparent);
    flex: none;
  }

  .model {
    display: flex;
    flex-direction: column;
    line-height: 1.25;
    min-width: 0;
  }

  .model strong {
    font-size: 15px;
    font-weight: 650;
  }

  .model span {
    font-size: 12px;
  }

  .badge {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: var(--r-pill);
    border: 1px solid var(--border);
    background: var(--surface);
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
  }

  .badge.demo {
    color: var(--warning);
    border-color: color-mix(in srgb, var(--warning) 40%, transparent);
  }

  dl {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  dl div {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }

  dt {
    color: var(--muted);
  }

  dd {
    margin: 0;
    font-size: 12px;
    text-align: right;
  }

  .sn {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .disconnect {
    justify-content: flex-start;
    color: var(--muted);
    margin: 0 -6px -4px;
  }

  .topbar,
  .tabs {
    display: none;
  }

  @media (max-width: 760px) {
    .sidebar {
      display: none;
    }

    .topbar {
      position: sticky;
      top: 0;
      z-index: 20;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 16px;
      background: color-mix(in srgb, var(--surface) 92%, transparent);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--border);
    }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 5px 10px;
      border-radius: var(--r-pill);
      border: 1px solid var(--border);
      background: var(--bg);
      color: var(--text);
      font-size: 13px;
      text-decoration: none;
      min-width: 0;
    }

    .tabs {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 30;
      display: flex;
      padding: 6px 4px calc(6px + env(safe-area-inset-bottom));
      background: color-mix(in srgb, var(--surface) 94%, transparent);
      backdrop-filter: blur(10px);
      border-top: 1px solid var(--border);
    }

    .tabs a {
      flex: 1 1 0;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: 6px 2px;
      border-radius: var(--r-sm);
      color: var(--muted);
      font-size: 11px;
      font-weight: 550;
      text-decoration: none;
    }

    .tabs a span {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .tabs a[aria-current='page'] {
      color: var(--accent);
    }
  }
</style>
