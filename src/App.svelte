<script lang=ts>
  import { currentPage } from 'src/stores'

  import Header from './Header.svelte'
  import Input from 'src/pages/Input.svelte'
  import Config from 'src/pages/Config.svelte'
</script>

<main>
  <Header />

  {#if $currentPage === 'DASHBOARD'}
    dashboard
  {:else if $currentPage === 'INPUT'}
    <Input />
  {:else if $currentPage === 'CONFIG'}
    <Config />
  {/if}
</main>

<style>
  main {
    width: 100%;
    height: 100%;
  }
</style>
