<script lang="ts">
  import { toasts } from '../lib/toast.svelte';
  import Icon from './Icon.svelte';

  const ICONS = { success: 'check', error: 'alert', warning: 'alert', info: 'info' } as const;
</script>

<div class="toasts" aria-live="polite">
  {#each toasts.items as toast (toast.id)}
    <div class="toast {toast.kind}" role={toast.kind === 'error' ? 'alert' : 'status'}>
      <span class="icon"><Icon name={ICONS[toast.kind]} size={16} /></span>
      <span class="msg">{toast.message}</span>
      <button class="close" aria-label="Dismiss" onclick={() => toasts.dismiss(toast.id)}>
        <Icon name="x" size={14} />
      </button>
    </div>
  {/each}
</div>

<style>
  .toasts {
    position: fixed;
    right: 20px;
    bottom: 20px;
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: min(380px, calc(100vw - 32px));
    pointer-events: none;
  }

  .toast {
    pointer-events: auto;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 12px 12px 14px;
    border-radius: var(--r-sm);
    border: 1px solid var(--border);
    background: var(--elevated);
    box-shadow: var(--shadow-elevated);
    animation: slide-in 200ms var(--ease);
  }

  .icon {
    display: flex;
    padding-top: 2px;
  }
  .success .icon {
    color: var(--success);
  }
  .error .icon {
    color: var(--danger);
  }
  .warning .icon {
    color: var(--warning);
  }
  .info .icon {
    color: var(--accent);
  }

  .msg {
    flex: 1;
    font-size: 13px;
  }

  .close {
    display: flex;
    border: 0;
    background: transparent;
    color: var(--muted);
    padding: 2px;
    border-radius: 4px;
  }

  @keyframes slide-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
  }

  @media (max-width: 760px) {
    .toasts {
      left: 16px;
      right: 16px;
      bottom: calc(76px + env(safe-area-inset-bottom));
      width: auto;
    }
  }
</style>
