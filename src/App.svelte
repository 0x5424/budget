<script lang=ts>
  import { currentPage } from 'src/stores'
</script>

<main>
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
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }
</style>
