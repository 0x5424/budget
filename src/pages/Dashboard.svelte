<script lang=ts>
  import type { Transaction } from 'src/lib/types'
  import { txns, mainCurrency, lastIncome, nextIncome, rangeStart, rangeEnd } from 'src/stores'
  import CurrentFinances from 'src/components/CurrentFinances.svelte'

  function sameDate({ year: txnYear, month: txnMonth, date: txnDate }: Transaction, date: Date | void) {
    if (!date) return false
    return (new Date(txnYear, txnMonth, txnDate)).getTime() === date.getTime()
  }

  function withinRange(txn: Transaction, startDate: Date, endDate: void | Date) {
    const txnDate = new Date(txn.year, txn.month, txn.date)

    if (!endDate) return startDate === txnDate

    return (txnDate >= startDate) && (txnDate < endDate)
  }

  $: sortedTxns = [...$txns].reverse().filter((txn) => {
    if (!$nextIncome) return true

    return (new Date($nextIncome.year, $nextIncome.month + 1, $nextIncome.date)) >= (new Date(txn.year, txn.month, txn.date))
  })
</script>

<div>
  {#if $txns.length}
    <CurrentFinances />
  {/if}
  <ul class='max-w-3xl mx-auto pb-8'>
    {#each sortedTxns as txn}
      <li
        class='grid grid-cols-8'
        class:text-green-600={!txn.source && txn.amount > 0}
        class:bg-red-50={sameDate(txn, $rangeEnd)}
        class:border-red-600={sameDate(txn, $rangeEnd)}
        class:next-income={sameDate(txn, $rangeEnd)}
        class:border-r={sameDate(txn, $rangeStart)}
        class:bg-green-50={sameDate(txn, $rangeStart)}
        class:bg-neutral-100={withinRange(txn, $rangeStart, $rangeEnd) && !sameDate(txn, $rangeStart)}
        class:last-income={sameDate(txn, $rangeStart)}
      >
        <button
          on:click={() => $nextIncome = txn}
          class='border border-transparent hover:border-black'
        >
          {txn.month + 1}-{txn.date}
        </button>
        <span class='truncate'>{txn.source ? txn.source : ''}</span>
        <span class='truncate'>{txn.account}</span>
        <span>{txn.currency}</span>
        <span class='col-span-2 flex justify-between'>
          <span>{txn.amount}</span>
          {#if txn.currency !== $mainCurrency}
            <span>({Math.round(txn.rate * txn.amount)})</span>
          {/if}
        </span>
        <button
          on:click={() => $lastIncome = txn}
          class='col-span-2 text-right border border-transparent hover:border-black'
        >
          {txn.label}
        </button>
      </li>
    {/each}
  </ul>
</div>

<style>
  .next-income {
    border-bottom-width: 1px;
  }

  /* is followed by another entry from the same date */
  .next-income:has(+ .next-income) {
    border-bottom-width: 0px;
  }

  /* add a border to the left of the next income item */
  .next-income + li:not(.next-income) {
    --tw-border-opacity: 1;
    border-left-color: rgb(239 68 68 / var(--tw-border-opacity));
    border-left-width: 1px;
  }

  .last-income {
    --tw-border-opacity: 1;
    border-color: rgb(34 197 94 / var(--tw-border-opacity));
    border-bottom-width: 1px;
  }

  .last-income:has(+ .last-income) {
    border-bottom-width: 0px;
  }
</style>
