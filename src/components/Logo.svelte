<script lang="ts">
  import { t } from '../lib/i18n/i18n.svelte';

  let { compact = false }: { compact?: boolean } = $props();
</script>

<div class="logo" class:compact>
  <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
    <rect x="1" y="1" width="30" height="30" rx="9" fill="var(--text)" />
    <rect x="8" y="6.5" width="16" height="8.5" rx="3" fill="var(--accent)" />
    <rect x="8" y="17" width="16" height="8.5" rx="3" fill="var(--bg)" opacity="0.9" />
  </svg>
  <div class="words">
    <strong>Hanlinyue</strong>
    {#if !compact}<span>{t('web.app.tagline')}</span>{/if}
  </div>
</div>

<style>
  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .words {
    display: flex;
    flex-direction: column;
    line-height: 1.15;
  }

  strong {
    font-size: 15px;
    font-weight: 650;
    letter-spacing: -0.01em;
  }

  span {
    font-size: 12px;
    color: var(--muted);
  }
</style>
