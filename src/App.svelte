<script lang=ts>
  import { currentPage } from 'src/stores'

  import Header from './Header.svelte'
</script>

<main>
  <Header />

  {#if $currentPage === 'DASHBOARD'}
    dashboard
  {:else if $currentPage === 'INPUT'}
    input
  {:else if $currentPage === 'CONFIG'}
    config
  {/if}
</main>

<style>
  main {
    width: 100%;
    height: 100%;
  }
</style>
