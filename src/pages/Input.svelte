<script lang=ts>
  let accountName
  let sign
  import { accounts } from 'src/stores'

  $: {
    console.log('yo this our account name', accountName)
  }
</script>

<form class='container' on:submit|preventDefault>
  <section class='mt-8 pb-10 border-b border-gray-900/10'>
    <div class='grid grid-cols-3 sm:grid-cols-5 gap-x-6 gap-y-8'>
      <div class='col-span-2 md:col-start-2'>
        <label for=account class='block text-sm font-medium leading-6'>Account Name?</label>
        <div class=mt-2>
          <input
            type=text
            id=account
            name=account
            list=accounts
            class='block w-full rounded-sm sm:text-sm'
            placeholder='Leave blank for cash'
            bind:value={accountName}
          />
          <datalist id=accounts>
            {#each ['foo', 'bar', 'baz'] as accountName}
              <option value={accountName} />
            {/each}
          </datalist>
        </div>
      </div>
      <div>
        <label for=currency class='block text-sm font-medium leading-6'>Currency <span class=text-rose-500 title=Required/></label>
        <div class=mt-2>
          <input
            type=text
            id=currency
            required
            name=currency
            list=currencies
            class='block w-full rounded-sm sm:text-sm'
            placeholder='Req.'
            bind:value={accountName}
          />
          <datalist id=currencies>
            {#each ['jpy', 'usd', 'btc', 'eth'] as currencyName}
              <option value={currencyName} />
            {/each}
          </datalist>
        </div>
      </div>
      <div class=md:col-start-2>
        <label class='flex flex-col text-sm font-medium leading-6'>
          Income?
          <input id=sign name=sign type=checkbox class='mx-3 my-2 rounded-sm' bind:checked={sign}>
          <p class='text-xs font-normal text-gray-500'>
            {sign ? 'Salary, dividends, etc' : 'This is an expense'}.
          </p>
        </label>
      </div>
      <div class=col-span-2>
        <label for=rawAmount class='block text-sm font-medium leading-6'>Amount <span class=text-rose-500 title=Required/></label>
        <div class=mt-2>
          <input
            type=number
            id=rawAmount
            name=rawAmount
            required
            min=0
            step=1
            inputmode=decimal
            class='block w-full rounded-sm sm:text-sm'
            bind:value={accountName}
          />
        </div>
      </div>
      <div class='col-span-3 md:col-start-2'>
        <label for=label class='block text-sm font-medium leading-6'>Label?</label>
        <div class=mt-2>
          <input
            type=text
            id=label
            name=label
            class='block w-full rounded-sm sm:text-sm'
            placeholder='Arbitrary label for personal reference'
            bind:value={accountName}
          />
        </div>
      </div>
    </div>
  </section>
  <section class='mt-8 grid grid-cols-3 sm:grid-cols-5'>
    <div class='col-start-3 md:col-start-4 flex justify-end'>
      <button
        type=submit
        disabled
        class='rounded-sm px-3 py-2 text-sm font-semibold shadow-sm hover:shadow-lg'
      >
        Save
      </button>
    </div>
  </section>
</form>

<style lang=postcss>
  span[title=Required]::before {
    padding: 0.2rem;
    font-size: 1.125rem;
    content: '*';
  }

  button {
    transition: all 0.2s linear;
  }

  /**
   * supplying all the hover states in just tailwind is ugly & too verbose (ie. hover but NOT disabled)
   * maybe theres a better way...
   *
   * class='rounded-sm px-3 py-2 shadow-sm hover:shadow-lg disabled:bg-orange-400 text-sm font-semibold text-white bg-[var(--color-brand)] hover:bg-white hover:text-[var(--color-brand)]'
   */
  button[type=submit] {
    color: white;
    background-color: var(--color-brand);
  }

  button[type=submit]:disabled {
    cursor: not-allowed;
    background-color: theme(colors.orange.400);
  }

  button[type=submit]:hover:not(:disabled) {
    color: var(--color-brand);
    background-color: white;
  }
</style>
