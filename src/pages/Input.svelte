<script lang=ts>
  import type { Transaction } from 'src/lib/types'
  import { today, accounts, currencies, DB, knownAccounts } from 'src/stores'

  let form: HTMLFormElement

  let accountName: string = $knownAccounts[0] || ''
  let currencyName: string = $currencies[0] || ''
  let rawAmount: void | string
  let label: string
  let date: string = $today.toISOString().slice(0, 10)
  let sign: boolean

  $: {
    console.log('accountName', accountName)
    console.log('currencyName', currencyName)
    console.log('rawAmount', rawAmount)
    console.log('label', label)
    console.log('sign', sign)
    console.log('date', date)

    console.log('DB!!', $DB)
  }

  function onSubmit() {
    if (!$knownAccounts.includes(accountName)) $knownAccounts = [...$knownAccounts, accountName]
    const multiplyBy = sign ? -1 : 1

    const givenDate = new Date(date)
    const newEntry: Transaction = {
      year: givenDate.getFullYear(),
      month: givenDate.getMonth(),
      date: givenDate.getDate(),
      currency: currencyName,
      account: accountName,
      amount: multiplyBy * Number(rawAmount),
      rate: 1
    }

    if (label && label !== '') newEntry.label = label
    const currentValues = $DB[accountName || ''] || []

    $DB = {
      ...$DB,
      [accountName]: [...currentValues, newEntry]
    }

    // then reset
    form.reset()
  }
</script>

<form bind:this={form} class='container' on:submit|preventDefault={onSubmit}>
  <section class='mt-8 pb-10 border-b border-gray-900/10'>
    <div class='grid grid-cols-3 sm:grid-cols-5 gap-x-6 gap-y-8'>
      <div class='col-span-2 md:col-start-2'>
        <label for=account class='block text-sm font-medium leading-6'>Account Name? <span title=Required/></label>
        <div class=mt-2>
          <input
            type=text
            id=account
            name=account
            list={$accounts.length ? 'accounts' : null}
            class='block w-full rounded-sm sm:text-sm'
            placeholder='Or enter new name'
            bind:value={accountName}
          />
          {#if !!$accounts.length}
            <datalist id=accounts>
              {#each $accounts as accountName}
                <option value={accountName} />
              {/each}
            </datalist>
          {/if}
        </div>
      </div>
      <div>
        <label for=currency class='block text-sm font-medium leading-6'>Currency <span title=Required/></label>
        <div class=mt-2>
          <input
            type=text
            id=currency
            required
            name=currency
            list=currencies
            class='block w-full rounded-sm sm:text-sm'
            placeholder='Req.'
            bind:value={currencyName}
          />
          {#if !!$currencies.length}
            <datalist id=currencies>
              {#each $currencies as currencyName}
                <option value={currencyName} />
              {/each}
            </datalist>
          {/if}
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
        <label for=rawAmount class='block text-sm font-medium leading-6'>Amount <span title=Required/></label>
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
            bind:value={rawAmount}
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
            bind:value={label}
          />
        </div>
      </div>
    </div>
  </section>
  <section class='mt-8 grid grid-cols-3 sm:grid-cols-5'>
    <div class='col-span-2 md:col-start-2 flex justify-end'>
      <input
        type=date
        id=entryDate
        name=entryDate
        bind:value={date}
        class='rounded-sm sm:text-sm'
      />
    </div>
    <div class='col-start-3 md:col-start-4 flex justify-end'>
      <button
        type=submit
        disabled={currencyName === '' || !rawAmount || accountName === ''}
        class='rounded-sm px-3 py-2 text-sm font-semibold shadow-sm hover:shadow-lg'
      >
        Save
      </button>
    </div>
  </section>
</form>

<style>
  span[title=Required]::before {
    padding: 0.2rem;
    font-size: 1.125rem;
    content: '*';
    color: red;
  }

  button {
    transition: all 0.2s linear;
  }

  /**
   * supplying all the hover states in just tailwind is ugly & too verbose (ie. hover but NOT disabled)
   * maybe theres a better way... idk it yet
   *
   * class='rounded-sm px-3 py-2 shadow-sm hover:shadow-lg disabled:bg-orange-400 text-sm font-semibold text-white bg-[var(--color-brand)] hover:bg-white hover:text-[var(--color-brand)]'
   */
  button[type=submit] {
    color: white;
    background-color: var(--color-brand);
  }

  button[type=submit]:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  button[type=submit]:hover:not(:disabled) {
    color: var(--color-brand);
    background-color: white;
  }
</style>
