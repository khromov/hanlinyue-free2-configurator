<script lang="ts">
  let { level }: { level: number | null } = $props();

  const pct = $derived(level === null ? 0 : Math.max(0, Math.min(100, level)));
  const tone = $derived(level === null ? 'unknown' : pct < 15 ? 'danger' : pct <= 30 ? 'warning' : 'ok');
</script>

<span class="battery {tone}">
  <svg width="20" height="10" viewBox="0 0 20 10" aria-hidden="true">
    <rect x="0.5" y="0.5" width="16" height="9" rx="2.5" fill="none" stroke="currentColor" opacity="0.5" />
    <rect x="17.5" y="3" width="2" height="4" rx="1" fill="currentColor" opacity="0.5" />
    <rect x="2" y="2" width={(13 * pct) / 100} height="6" rx="1.5" fill="currentColor" />
  </svg>
  <span class="mono">{level === null ? '—' : `${pct}%`}</span>
</span>

<style>
  .battery {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
  }
  .ok,
  .unknown {
    color: var(--text);
  }
  .warning {
    color: var(--warning);
  }
  .danger {
    color: var(--danger);
  }
</style>
