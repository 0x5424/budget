<script lang=ts>
  import { txns, mainCurrency, lastIncome, nextIncome } from 'src/stores'
  import CurrentFinances from 'src/components/CurrentFinances.svelte'

  function sameDate({ year: yA, month: mA, date: dA }: Transaction, b: Transaction | void) {
    if (!b) return false
    const { year, month, date } = b

    return (yA === year) && (mA === month) && (dA === date)
  }

  function withinRange(txn, starty, endy) {
    const endDate = new Date(endy.year, endy.month, endy.date)
    const startDate = new Date(starty.year, starty.month, starty.date)
    const theDate = new Date(txn.year, txn.month, txn.date)

    return (theDate >= startDate) && (theDate < endDate)
  }

  $: sortedTxns = [...$txns].reverse().filter((txn) => (new Date($nextIncome.year, $nextIncome.month + 1, $nextIncome.date)) >= (new Date(txn.year, txn.month, txn.date)))
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
        class:bg-neutral-100={withinRange(txn, $lastIncome, $nextIncome)}
        class:border-l={sameDate(txn, $nextIncome)}
        class:bg-red-50={sameDate(txn, $nextIncome)}
        class:next-income={sameDate(txn, $nextIncome)}
        class:border-r={sameDate(txn, $lastIncome)}
        class:bg-green-50={sameDate(txn, $lastIncome)}
        class:last-income={sameDate(txn, $lastIncome)}
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
    --tw-border-opacity: 1;
    border-color: rgb(239 68 68 / var(--tw-border-opacity));
    border-bottom-width: 1px;
  }

  /* is followed by another entry from the same date */
  .next-income:has(+ .next-income) {
    border-bottom-width: 0px;
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
