<script lang=ts>
  import { currentPage } from 'src/stores'

  import Header from './Header.svelte'
  import Input from 'src/pages/Input.svelte'
  import Settings from 'src/pages/Settings.svelte'
</script>

<main>
  <Header />

  {#if $currentPage === 'DASHBOARD'}
    dashboard
  {:else if $currentPage === 'INPUT'}
    <Input />
  {:else if $currentPage === 'SETTINGS'}
    <Settings />
  {/if}
</main>

<style>
  main {
    width: 100%;
    height: 100%;
  }
</style>
