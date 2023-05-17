<script lang=ts>
  import { accounts, creditors, trustedCreditors } from 'src/stores'

  function toggleCreditor(name: string) {
    const isPresent = !!$creditors.find(val => val === name)
    return $creditors = isPresent ? $creditors.filter(val => val !== name) : [...$creditors, name]
  }

  function toggleTrustedCreditor(name: string) {
    const isPresent = !!$trustedCreditors.find(val => val === name)
    return $trustedCreditors = isPresent ? $trustedCreditors.filter(val => val !== name) : [...$trustedCreditors, name]
  }
</script>

<article class=container>
  <header class='mt-8 pb-10 border-b border-gray-900/01'>
    <div class='grid grid-cols-3 sm:grid-cols-5 gap-x-6 gap-y-8'>
      <div class='col-span-3 md:col-start-2'>
        <h2 class='text-base font-semibold leading-7 text-gray-900'>Application Configuration</h2>
        <p class='mt-1 max-w-2xl text-sm leading-6 text-gray-500'>Various configs altering calculation algorithms.</p>
      </div>
    </div>
  </header>

  <section class='mt-8 pb-10 border-b border-gray-900/01'>
    <div class='grid grid-cols-3 sm:grid-cols-5 gap-x-6 gap-y-8'>
      <div class='col-span-2 md:col-start-2'>
        <h3 class='block text-sm font-medium leading-6'>Creditors</h3>
        <p class='mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0'>Specify which accounts transact with a monthly balance. Selecting an account here causes their expenses to be deducted from the <em>next</em> month's balance, as a repayment of debt.</p>
      </div>

      <div class='col-span-1 md:col-span-2'>
        <ul>
          {#each $accounts as accountName}
            <li class=my-2>
              <label>
                <code class='m-2 account-name'>{accountName}</code>
                <input
                  name={`creditor-${accountName}`}
                  type=checkbox
                  checked={$creditors.includes(accountName)}
                  on:change={() => toggleCreditor(accountName)}
                />
              </label>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </section>

  {#if $creditors.length}
    <section class='mt-8 pb-10 border-b border-gray-900/01'>
      <div class='grid grid-cols-3 sm:grid-cols-5 gap-x-6 gap-y-8'>
        <div class='col-span-2 md:col-start-2'>
          <h3 class='block text-sm font-medium leading-6'>High-trust Creditors</h3>
          <p class='mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0'>A subset of creditors, these accounts charge 0 interest for their loans. Selecting an account here prevents an equivalent repayment expense from being generated in next month's projected balance.</p>
        </div>

        <div class='col-span-1 md:col-span-2'>
          <ul>
            {#each $creditors as creditorName}
              <li class=my-2>
                <label>
                  <code class='m-2 account-name'>{creditorName}</code>
                  <input
                    name={`trusted-creditor-${creditorName}`}
                    type=checkbox
                    checked={$trustedCreditors.includes(creditorName)}
                    on:change={() => toggleTrustedCreditor(creditorName)}
                  />
                </label>
              </li>
            {/each}
          </ul>
        </div>
      </div>
    </section>
  {/if}

</article>

<style>
  .account-name {
    padding: 0.5em;
    background-color: #eeee;
  }
</style>
