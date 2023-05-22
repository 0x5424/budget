<script lang=ts>
  import { DB, accounts, currencies } from 'src/stores'
  import { creditors, knownAccounts, trustedCreditors, mainCurrency, mainAccount, omitIncomeFilters } from 'src/stores'
  import Paperclip from 'src/components/Paperclip.svelte'
  import Warning from 'src/components/Warning.svelte'
  import IncomeFilterListItem from 'src/components/IncomeFilterListItem.svelte'
  import { stringifyLedger, parseLedger } from 'src/lib/csv'

  let ledgerCsv = '#'
  let ledgerDetailsOpen = false
  /** @wtf export link is not focusable on Safari via keyboard navigation */
  let ledgerExportTabindex = -1
  let ledgerImportTabindex = -1

  function toggleMainCurrency(name: string) {
    $mainCurrency = name
  }

  function toggleMainAccount(name: string) {
    $mainAccount = name
  }

  function toggleCreditor(name: string) {
    const isPresent = !!$creditors.find(val => val === name)
    return $creditors = isPresent ? $creditors.filter(val => val !== name) : [...$creditors, name]
  }

  function toggleTrustedCreditor(name: string) {
    const isPresent = !!$trustedCreditors.find(val => val === name)
    return $trustedCreditors = isPresent ? $trustedCreditors.filter(val => val !== name) : [...$trustedCreditors, name]
  }

  $: downloadLedgerText = (() => {
    let totalItems = 0
    let totalAccounts = 0
    Object.entries($DB).forEach(([acc, txns]) => {
      totalItems += txns.length
      totalAccounts += Number($accounts.includes(acc))
    })

    if (!totalItems) return 'no items'

    // tiny consideration... but pluralize text
    return [totalAccounts, totalItems].map((count, idx) => {
      let textKind = 'account'
      if (idx === 1) textKind = 'item'

      if (count > 1) textKind += 's'

      return `${count} ${textKind}`
    }).join(', ')
  })()

  $: if (ledgerDetailsOpen) {
    ledgerExportTabindex = 0
    ledgerImportTabindex = 0
  } else {
    ledgerExportTabindex = -1
    ledgerImportTabindex = -1
  }

  async function onLedgerImport({ currentTarget }: { currentTarget: EventTarget & HTMLInputElement }) {
    const file = currentTarget.files[0]
    if (!file) return

    const parsed = parseLedger(await file.text())
    const newDB = parsed.reduce((out, txn) => {
      if (!out[txn.account]) out[txn.account] = []
      out[txn.account].push(txn)

      return out
    }, {})

    DB.cleanStorage()
    $DB = newDB
    $knownAccounts = Object.keys(newDB)
  }

  // subscribe to db changes to revoke any outdated csvs, then create new value
  DB.subscribe(db => {
    const flattenedDB = Object.entries(db).flatMap(([_, txns]) => txns)
    if (!flattenedDB.length) return

    if (ledgerCsv !== '' && ledgerCsv !== '#') {
      URL.revokeObjectURL(ledgerCsv)
    }

    ledgerCsv = URL.createObjectURL(new Blob([stringifyLedger(flattenedDB)], { type: 'text/csv' }))
  })
</script>

<article class='container max-w-3xl mx-auto px-6'>
  <header class='py-10 border-b border-gray-900/10'>
    <div class='grid grid-cols-3 md:grid-cols-5 gap-x-6 gap-y-8'>
      <div class='col-span-3 md:col-span-2'>
        <h2 class='text-base font-semibold leading-7 text-gray-900'>Settings</h2>
        <p class='mt-1 max-w-2xl text-sm leading-6 text-gray-500'>App-wide settings. Some settings will affect expense calculation.</p>
      </div>
      <div class='col-span-3'>
        <div>
          <h3 class='block text-sm font-medium leading-6 mb-1'>Import/Export</h3>
          <ul class='divide-y divide-gray-100 rounded-md border border-gray-200'>
            <li class='px-5 py-4 text-sm leading-6'>
              <details class='flex items-center' bind:open={ledgerDetailsOpen}>
                <summary class='flex justify-between expand-button rounded-sm px-3 py-2 text-sm font-medium ring-0 ring-inset ring-gray-900/10 shadow-sm hover:ring-1'>
                  <div class='flex gap-x-2'>
                    <Paperclip />
                    <span class='truncate font-medium'>ledger.csv</span>
                  </div>
                  <span class='flex-shrink-0 text-gray-400'>{downloadLedgerText}</span>
                </summary>
                <div class='p-3 rounded-b-lg border-t bg-gray-100 grid grid-cols-3 gap-x-2 gap-y-3'>
                  <div class='col-span-3 md:col-span-2'>
                    <div class='flex items-center gap-x-2'>
                      <Warning />
                      <h4 class='text-base font-semibold mb-1 text-gray-900'>Warning</h4>
                    </div>
                    <p>This import replaces all transactions and accounts. Other app data is unaffected, so any account-related settings may no longer be applicable after importing.</p>
                  </div>
                  <div class='col-span-3 md:col-span-1 flex md:flex-col justify-around'>
                    <a tabindex={ledgerExportTabindex} href={ledgerCsv} download=ledger.csv class='expand-button rounded-sm px-3 py-2 text-sm font-medium ring-0 ring-inset ring-gray-900/10 shadow-sm hover:ring-1'>
                      Export
                    </a>
                    <label class='relative expand-button rounded-sm px-3 py-2 text-sm font-medium ring-0 ring-inset ring-gray-900/10 shadow-sm hover:ring-1'>
                      Import
                      <span class='bring-back-browser-default-focus-style-because-opacity-hides-outline-colors-too absolute left-0 top-0 max-w-full h-full'>
                        <input
                          type='file'
                          name='ledger-import'
                          accept='text/csv'
                          class='max-w-full h-full opacity-0'
                          tabindex={ledgerImportTabindex}
                          on:change={onLedgerImport}
                        />
                      </span>
                    </label>
                  </div>
                </div>
              </details>
            </li>
            {#if $accounts.length}
            <li class='gap-4 px-5 py-4 text-sm leading-6'>
              {'todo, add accounts here :)'}
            </li>
            {/if}
          </ul>
        </div>
      </div>
    </div>
  </header>

  <section class='py-6 border-b border-gray-900/01'>
    <div class='grid grid-cols-3 md:grid-cols-5 gap-x-6 gap-y-8'>
      <div class='col-span-2 md:col-span-3'>
        <h3 class='block text-sm font-medium leading-6 mb-1'>Main currency</h3>
        <p class='text-sm leading-6 text-gray-700 md:col-span-2 md:mt-0'>Select the base currency for the app. This affects dashboard calculations for the current period.</p>
      </div>

      <div class='col-span-1 md:col-span-2'>
        <ul>
          {#each $currencies as currencyName}
            <li class=my-2>
              <label>
                <code class='m-2 account-name'>{currencyName}</code>
                <input
                  name={`currency-${currencyName}`}
                  type=radio
                  checked={$mainCurrency === currencyName}
                  on:change={() => toggleMainCurrency(currencyName)}
                />
              </label>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </section>

  <section class='py-6 border-b border-gray-900/01'>
    <div class='grid grid-cols-3 md:grid-cols-5 gap-x-6 gap-y-8'>
      <div class='col-span-2 md:col-span-3'>
        <h3 class='block text-sm font-medium leading-6 mb-1'>Main account</h3>
        <p class='text-sm leading-6 text-gray-700 md:col-span-2 md:mt-0'>The default account for new transactions.</p>
      </div>

      <div class='col-span-1 md:col-span-2'>
        <ul>
          {#each $accounts as accountName}
            <li class=my-2>
              <label>
                <code class='m-2 account-name'>{accountName}</code>
                <input
                  name={`account-${accountName}`}
                  type=radio
                  checked={$mainAccount === accountName}
                  on:change={() => toggleMainAccount(accountName)}
                />
              </label>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </section>

  <section class='py-6 border-b border-gray-900/01'>
    <div class='grid grid-cols-4 md:grid-cols-5 gap-x-2 gap-y-8'>
      <div class='col-span-2 md:col-span-3'>
        <h3 class='block text-sm font-medium leading-6 mb-1'>Creditors</h3>
        <p class='text-sm leading-6 text-gray-700 md:col-span-2 md:mt-0'>Specify which accounts transact with a monthly balance. Selecting an account here causes their expenses to be deducted from the <em>next</em> month's balance, as a repayment of debt.</p>
      </div>

      <div class='col-span-2 md:col-span-2'>
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
    <section class='py-6 border-b border-gray-900/01'>
      <div class='grid grid-cols-4 md:grid-cols-5 gap-x-6 gap-y-8'>
        <div class='col-span-2 md:col-span-3'>
          <h3 class='block text-sm font-medium leading-6 mb-1'>High-trust Creditors</h3>
          <p class='text-sm leading-6 text-gray-700 md:col-span-2 md:mt-0'>A subset of creditors, these accounts charge 0 interest for their loans. Selecting an account here prevents an equivalent repayment expense from being generated in next month's projected balance.</p>
        </div>

        <div class='col-span-2 md:col-span-2'>
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

  {#if $omitIncomeFilters.length}
    <section class='py-6 border-b border-gray-900/01'>
      <div class='grid grid-cols-3 md:grid-cols-5 gap-x-6 gap-y-8'>
        <div class='col-span-3 md:col-span-5'>
          <h3 class='block text-sm font-medium leading-6 mb-1'>Income filters</h3>
          <p class='text-sm leading-6 text-gray-700 md:col-span-2 md:mt-0'>During monthly calculations of <em>income</em>, any transations matching these conditions will be omitted. <strong>
          This doesn't affect expense calculation.</strong> currently doesn't work lol</p>
        </div>

        <div class='col-span-3 md:col-span-5'>
          <ul>
            <li>todo: new Item</li>
            {#each $omitIncomeFilters as incomeFilter}
              <IncomeFilterListItem filterItem={incomeFilter} />
            {/each}
          </ul>
        </div>
      </div>
    </section>
  {/if}
</article>

<style>
  .account-name {
    font-size: 0.875rem;
    padding: 0.5em;
    background-color: #eeee;
  }

  summary { list-style: none; }
  summary::-webkit-details-marker {
    display: none;
  }

  .expand-button {
    text-align: center;
    transition: all 0.2s linear;
  }

  .expand-button:hover {
    color: var(--color-brand);
  }

  .bring-back-browser-default-focus-style-because-opacity-hides-outline-colors-too:focus-within {
    outline: 5px auto Highlight;
    outline: 5px auto -webkit-focus-ring-color;
  }
</style>
