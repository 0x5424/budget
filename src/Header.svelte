<script lang=ts>
  import { ALL_PAGES, currentPage } from 'src/stores'
</script>

<header>
  <nav>
    <ul>
      {#each ALL_PAGES as pageName}
        <li aria-current={$currentPage === pageName ? "page" : null}>
          <button on:click={() => $currentPage = pageName}>{pageName}</button>
        </li>
      {/each}
    </ul>
  </nav>
</header>

<style>
  header,
  nav,
  ul { display: flex; }

  header { justify-content: space-between; }

  nav {
    justify-content: center;
    margin: 0 auto;
  }

  ul {
    position: relative;
    list-style: none;
    justify-content: center;
    align-items: center;
    padding: 0;
  }

  li {
    position: relative;
    height: 100%;
  }

  li[aria-current=page]::before {
    content: '';
    width: 0;
    height: 0;
    position: absolute;
    top: 0;
    left: calc(50% - 6px);
    border: 6px solid transparent;
    border-top: 6px solid var(--color-brand);
  }

  button {
    display: flex;
    height: 100%;
    align-items: center;
    padding: 0.5rem;
    border: none;
    color: rgba(0,0,0,0.7);
    background-color: rgba(0,0,0,0);
    font-weight: 700;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    transition: color 0.2s linear;
  }

  button:hover {
    cursor: pointer;
    color: var(--color-brand);
  }
</style>
