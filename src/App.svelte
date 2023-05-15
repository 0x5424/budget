<script lang=ts>
  import { currentPage } from 'src/stores'

  import Header from './Header.svelte'
  import Input from 'src/pages/Input.svelte'
</script>

<main>
  <Header />

  {#if $currentPage === 'DASHBOARD'}
    dashboard
  {:else if $currentPage === 'INPUT'}
    <Input />
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
