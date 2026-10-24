<script lang="ts">
  import { dialog } from '../lib/dialog.svelte';
  import Modal from './Modal.svelte';
</script>

<Modal open={dialog.current !== null} title={dialog.current?.title ?? ''} onclose={() => dialog.close()} width="480px">
  <p class="body">{dialog.current?.body}</p>
  {#snippet footer()}
    <button class="btn btn-primary" onclick={() => dialog.close()}>{dialog.current?.confirm}</button>
  {/snippet}
</Modal>

<style>
  .body {
    white-space: pre-line;
    color: var(--muted);
    line-height: 1.6;
  }
</style>
