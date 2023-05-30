<script lang=ts>
  import type { Transaction } from 'src/lib/types'
  import { today, accounts, currencies, mainCurrency, mainAccount, DB, txns, knownAccounts } from 'src/stores'
  import { onMount } from 'svelte'

  export let transaction: void | Transaction = null
  export let afterSubmit: () => void = () => {}

  let accountName: string = transaction ? transaction.account : $mainAccount || ''
  let currencyName: string = transaction ? transaction.currency : $mainCurrency || ''
  let rawAmount: void | number = transaction ? Math.abs(transaction.amount) : null
  let rateEquivalent: void | string
  let sign = transaction ? transaction.amount > 0 : false
  let rawLabel = transaction ? transaction.label : ''
  let date: string = transaction ? `${transaction.year}-${`${transaction.month + 1}`.padStart(2, '0')}-${`${transaction.date}`.padStart(2, '0')}` : $today.toISOString().slice(0, 10)

  // rate is reactive in the event an "equivalent" is provided
  $: useRateEquivalent = Boolean(rawAmount && rateEquivalent)
  $: rawRate = rawAmount && rateEquivalent ? Number(rateEquivalent) / rawAmount : rawRate

  // $: {
  //   console.table({
  //     accountName,
  //     currencyName,
  //     rawAmount,
  //     rawLabel,
  //     sign,
  //     date,
  //   })
  // }

  function onSubmit() {
    const multiplyBy = sign ? 1 : -1
    // todo move to a store or smth
    const formattedRate = `${rawRate}`.split('.').slice(0, 2).filter(s => Boolean(s.length)).map(s => s.replaceAll(/\D/g, '')).join('.')
    const rateNum = Number(formattedRate)

    /**
     * "float bad for currency"
     *
     * its fine for personal finances of this size.... for now
     */
    const rateToPersist = rateNum % 1 === 0 ? rateNum : Number(rateNum.toFixed(6))

    const givenDate = new Date(date)
    const newEntry: Transaction = {
      year: givenDate.getFullYear(),
      month: givenDate.getMonth(),
      date: givenDate.getDate(),
      currency: currencyName,
      account: accountName,
      amount: multiplyBy * Number(rawAmount),
      rate: rateToPersist
    }

    if (rawLabel !== '') newEntry.label = rawLabel

    /** update stores */
    const newLedger = !transaction ? $txns : $txns.filter(txn => {
      // remove the entry matching the passed-in prop
      return JSON.stringify(txn) !== JSON.stringify(transaction)
    })

    newLedger.push(newEntry)
    DB.reinitialize(newLedger)

    if (!$knownAccounts.includes(accountName)) $knownAccounts = [...$knownAccounts, accountName]
    if ($mainAccount === '') $mainAccount = accountName
    if ($mainCurrency === '') $mainCurrency = currencyName

    /**
     * then reset relevant form values
     * @note (form.reset doesn't reset svelte vars)
     */
    // keep account, currency
    rawAmount = null
    sign = false
    rawLabel = ''
    rateEquivalent = null
    // keep date

    afterSubmit()
  }

  onMount(() => {
    // set rate onMount without affecting the reactive value's default
    rawRate = '1'
  })
</script>

<form autocomplete=off class='container max-w-xl mx-auto px-6' on:submit|preventDefault={onSubmit}>
  <section class='py-10 border-b border-gray-900/10'>
    <div class='grid grid-cols-7 md:grid-cols-10 gap-x-5 gap-y-6'>
      <div class='col-span-4 md:col-span-2'>
        <label for=account class='block text-sm font-medium leading-6'>Account <span title=Required/></label>
        <div class=mt-2>
          <input
            type=text
            id=account
            name=account
            list={$accounts.length ? 'accounts' : null}
            class='block w-full rounded-sm text-sm'
            placeholder='Or enter new name'
            bind:value={accountName}
          />
          {#if $accounts.length}
            <datalist id=accounts>
              {#each $accounts as accountName}
                <option value={accountName} />
              {/each}
            </datalist>
          {/if}
        </div>
      </div>
      <div class='col-span-3 md:col-span-2'>
        <label for=currency class='block text-sm font-medium leading-6'>Currency <span title=Required/></label>
        <div class=mt-2>
          <input
            type=text
            id=currency
            required
            name=currency
            list=currencies
            class='block w-full rounded-sm text-sm'
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
      <div class='col-span-2 md:col-span-2'>
        <label class='flex flex-col text-sm font-medium leading-6'>
          Income?
          <input id=sign name=sign type=checkbox class='mx-3 my-2 rounded-sm' bind:checked={sign}>
          <p class='text-xs font-normal text-gray-500'>
            {sign ? 'Salary, dividends, etc' : 'This is an expense'}.
          </p>
        </label>
      </div>
      <div class='col-span-5 md:col-span-4'>
        <label for=rawAmount class='block text-sm font-medium leading-6'>Amount <span title=Required/></label>
        <div class=mt-2>
          <input
            type=number
            id=rawAmount
            name=rawAmount
            required
            step=any
            inputmode=decimal
            class='block w-full rounded-sm md:text-sm'
            bind:value={rawAmount}
          />
        </div>
      </div>
      <div class='col-span-3'>
        <label for=rawDate class='block text-sm font-medium leading-6'>Exchange Rate <span title=Required/></label>
        <div class=mt-2>
          <input
            type=text
            id=rawRate
            name=rawRate
            required
            readonly={useRateEquivalent}
            inputmode=decimal
            class='block w-full rounded-sm text-sm'
            class:bg-gray-100={useRateEquivalent}
            bind:value={rawRate}
          />
        </div>
      </div>
      {#if currencyName !== $mainCurrency}
        <div class='col-span-4 md:col-span-3'>
          <label for=rateEquivalent class='block truncate text-sm font-medium leading-6'>Or, {$mainCurrency} value</label>
          <div class=mt-2>
            <input
              type=text
              id=rateEquivalent
              name=rateEquivalent
              inputmode=decimal
              class='block w-full rounded-sm text-sm'
              bind:value={rateEquivalent}
            />
          </div>
        </div>
      {/if}
      <div
        class={
          currencyName === $mainCurrency ?
          'col-span-4 md:col-span-7' :
          'col-span-7 md:col-span-4'
        }
      >
        <label for=label class='block text-sm font-medium leading-6'>Label?</label>
        <div class=mt-2>
          <input
            type=text
            id=label
            name=label
            class='block w-full rounded-sm text-sm'
            placeholder='For personal reference'
            bind:value={rawLabel}
          />
        </div>
      </div>
    </div>
  </section>
  <section class='py-8 grid grid-cols-4'>
    <div
      class='flex justify-end'
      class:col-span-3={!$$slots.cancelButton}
      class:col-span-2={$$slots.cancelButton}
    >
      <input
        type=date
        id=entryDate
        name=entryDate
        bind:value={date}
        class='rounded-sm sm:text-sm'
      />
    </div>
    {#if $$slots.cancelButton}
      <div class='flex justify-end'>
        <slot name=cancelButton />
      </div>
    {/if}
    <div class='flex justify-end'>
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
