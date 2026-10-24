<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    subtitle?: string;
    /** Device illustration column. */
    stage?: Snippet;
    /** Primary actions (Save). Sticky at the bottom on phones. */
    actions?: Snippet;
    /** Small print under the settings. */
    footnote?: Snippet;
    children: Snippet;
  }

  let { title, subtitle, stage, actions, footnote, children }: Props = $props();
</script>

<div class="page">
  <header class="page-head">
    <div class="titles">
      <h1>{title}</h1>
      {#if subtitle}<p class="muted">{subtitle}</p>{/if}
    </div>
    {#if actions}<div class="actions desktop">{@render actions()}</div>{/if}
  </header>

  <div class="grid" class:no-stage={!stage}>
    {#if stage}
      <div class="stage-col">
        <div class="stage">{@render stage()}</div>
      </div>
    {/if}
    <div class="settings">
      {@render children()}
      {#if footnote}<div class="footnote">{@render footnote()}</div>{/if}
    </div>
  </div>

  {#if actions}<div class="actions mobile">{@render actions()}</div>{/if}
</div>

<style>
  .page {
    padding: 28px 32px 48px;
    max-width: 1180px;
  }

  .page-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 24px;
  }

  .titles {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .titles p {
    max-width: 62ch;
  }

  .actions {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }

  .actions.mobile {
    display: none;
  }

  .grid {
    display: grid;
    grid-template-columns: minmax(300px, 400px) minmax(0, 640px);
    gap: 28px;
    align-items: start;
  }

  .grid.no-stage {
    grid-template-columns: minmax(0, 760px);
  }

  .stage-col {
    position: sticky;
    top: 24px;
  }

  .stage {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 18px;
    min-height: 440px;
    padding: 36px 24px;
    border-radius: var(--r-lg);
    background:
      radial-gradient(120% 70% at 50% 20%, var(--stage-glow), transparent 70%),
      var(--stage);
    border: 1px solid var(--border);
    overflow: hidden;
  }

  .settings {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  .footnote {
    font-size: 12px;
    color: var(--muted);
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 4px 2px;
  }

  @media (max-width: 1080px) {
    .grid {
      grid-template-columns: minmax(0, 1fr);
      max-width: 680px;
    }
    .stage-col {
      position: static;
    }
    .stage {
      min-height: 0;
      padding: 28px 20px;
    }
  }

  @media (max-width: 760px) {
    .page {
      padding: 20px 16px calc(150px + env(safe-area-inset-bottom));
    }
    .page-head {
      margin-bottom: 16px;
    }
    h1 {
      font-size: 24px;
    }
    .actions.desktop {
      display: none;
    }
    .actions.mobile {
      display: flex;
      position: fixed;
      left: 0;
      right: 0;
      bottom: calc(62px + env(safe-area-inset-bottom));
      z-index: 25;
      padding: 10px 16px;
      background: color-mix(in srgb, var(--bg) 92%, transparent);
      backdrop-filter: blur(10px);
      border-top: 1px solid var(--border);
    }
    .actions.mobile :global(.btn) {
      flex: 1;
    }
    .grid {
      gap: 16px;
    }
    .stage {
      padding: 24px 16px;
      border-radius: var(--r-md);
    }
  }
</style>
