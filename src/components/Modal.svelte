<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';

  interface Props {
    open: boolean;
    title: string;
    onclose: () => void;
    width?: string;
    children: Snippet;
    footer?: Snippet;
    header?: Snippet;
  }

  let { open, title, onclose, width = '520px', children, footer, header }: Props = $props();

  let el: HTMLDialogElement | undefined = $state();

  $effect(() => {
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  });
</script>

<dialog
  bind:this={el}
  style:--modal-w={width}
  onclose={onclose}
  onclick={(e) => {
    if (e.target === el) onclose();
  }}
>
  {#if open}
    <!-- svelte-ignore a11y_autofocus -->
    <div class="modal" tabindex="-1" autofocus>
      <header>
        <h2>{title}</h2>
        {@render header?.()}
        <button class="btn btn-ghost btn-sm icon-btn" aria-label="Close" onclick={onclose}><Icon name="x" /></button>
      </header>
      <div class="body">
        {@render children()}
      </div>
      {#if footer}
        <footer>{@render footer()}</footer>
      {/if}
    </div>
  {/if}
</dialog>

<style>
  dialog {
    width: min(var(--modal-w), calc(100vw - 32px));
    max-height: calc(100dvh - 48px);
    padding: 0;
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    background: var(--elevated);
    color: var(--text);
    box-shadow: var(--shadow-elevated);
    overflow: hidden;
  }

  dialog[open] {
    animation: pop 180ms var(--ease);
  }

  dialog::backdrop {
    background: rgba(10, 10, 12, 0.45);
    backdrop-filter: blur(2px);
  }

  .modal:focus {
    outline: none;
  }

  .modal {
    display: flex;
    flex-direction: column;
    max-height: calc(100dvh - 50px);
  }

  header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 18px 16px 14px 24px;
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
  }

  header h2 {
    flex: 1 1 auto;
    font-size: 18px;
  }

  .icon-btn {
    width: 32px;
    padding: 0;
    margin-left: auto;
  }

  .body {
    padding: 20px 24px;
    overflow: auto;
  }

  footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 14px 24px 18px;
    border-top: 1px solid var(--border);
    flex-wrap: wrap;
  }

  @keyframes pop {
    from {
      opacity: 0;
      transform: translateY(6px) scale(0.98);
    }
  }

  @media (max-width: 760px) {
    dialog {
      width: 100vw;
      max-width: 100vw;
      max-height: 92dvh;
      margin: auto 0 0;
      border-radius: var(--r-lg) var(--r-lg) 0 0;
    }
    .modal {
      max-height: 92dvh;
    }
    header {
      padding: 16px 12px 12px 16px;
    }
    .body {
      padding: 16px;
    }
    footer {
      padding: 12px 16px calc(16px + env(safe-area-inset-bottom));
    }
  }
</style>
