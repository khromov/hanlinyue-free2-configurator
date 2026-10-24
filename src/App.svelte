<script lang="ts">
  import GlobalDialog from './components/GlobalDialog.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import Toasts from './components/Toasts.svelte';
  import { device } from './lib/device.svelte';
  import { router } from './lib/router.svelte';
  import Connect from './pages/Connect.svelte';
  import Custom from './pages/Custom.svelte';
  import Light from './pages/Light.svelte';
  import More from './pages/More.svelte';
  import Presets from './pages/Presets.svelte';
  import Scripts from './pages/Scripts.svelte';

  const def = $derived(device.ready ? device.device : null);

  // Lighting only exists on some models.
  $effect(() => {
    if (def && router.current === 'light' && !def.hasLight) router.go('presets');
  });
</script>

{#if def}
  <div class="shell">
    <Sidebar />
    <main>
      {#key def.id}
        {#if router.current === 'presets'}
          <Presets {def} />
        {:else if router.current === 'custom'}
          <Custom {def} />
        {:else if router.current === 'scripts'}
          <Scripts {def} />
        {:else if router.current === 'light' && def.hasLight}
          <Light {def} />
        {:else if router.current === 'more'}
          <More {def} />
        {/if}
      {/key}
    </main>
  </div>
{:else}
  <Connect />
{/if}

<Toasts />
<GlobalDialog />

<style>
  .shell {
    display: flex;
    min-height: 100dvh;
  }

  main {
    flex: 1;
    min-width: 0;
  }

  @media (max-width: 760px) {
    .shell {
      flex-direction: column;
    }
  }
</style>
