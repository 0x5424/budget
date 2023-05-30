<script lang=ts>
  import type { Transaction } from 'src/lib/types'
  import { txns, mainCurrency, lastIncome, nextIncome, rangeStart, rangeEnd } from 'src/stores'
  import CurrentFinances from 'src/components/CurrentFinances.svelte'
  import Input from './Input.svelte'

  let dialog: HTMLDialogElement

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
  $: selectedTxnIdx = null
</script>

<div>
  {#key selectedTxnIdx}
    <dialog class='m-auto p-0' bind:this={dialog}>
      <Input
        transaction={sortedTxns[selectedTxnIdx] ? {...sortedTxns[selectedTxnIdx]} : null}
        afterSubmit={() => dialog.close()}
      >
        <button
          type=button
          slot=cancelButton
          class='rounded-sm px-3 py-2 text-sm font-semibold shadow-sm hover:shadow-lg'
          on:click={() => {
            dialog.close()
            selectedTxnIdx = null
          }}
        >
          Cancel
        </button>
      </Input>
    </dialog>
  {/key}
  {#if $txns.length}
    <CurrentFinances />
  {/if}
  <ul class='max-w-2xl mx-auto pb-8'>
    {#each sortedTxns as txn, idx}
      <li
        class:text-green-600={!txn.source && txn.amount > 0}
        class:bg-red-50={sameDate(txn, $rangeEnd)}
        class:border-red-600={sameDate(txn, $rangeEnd)}
        class:next-income={sameDate(txn, $rangeEnd)}
        class:border-r={sameDate(txn, $rangeStart)}
        class:bg-green-50={sameDate(txn, $rangeStart)}
        class:bg-neutral-100={withinRange(txn, $rangeStart, $rangeEnd) && !sameDate(txn, $rangeStart)}
        class:last-income={sameDate(txn, $rangeStart)}
      >
        {#if selectedTxnIdx === idx}
        <div class='px-2 py-3 border-y border-neutral-300'>
          <div class='grid grid-cols-5'>
            <button
              class='font-semibold rounded-sm mb-auto py-1 text-white bg-red-500'
              on:click={() => {
                $nextIncome = txn
                selectedTxnIdx = null
              }}
            >
              End
            </button>
            <div class='col-span-2 mx-2 text-left'>
              Date:
              <span>{txn.year}-{txn.month + 1}-{txn.date}</span>
            </div>
            <span class='col-span-2 text-right'>{txn.label}</span>
          </div>

          <div class='grid grid-cols-5 py-3'>
            <span
              class='flex justify-evenly'
              class:col-span-2={txn.source}
            >
              {#if txn.source}
                <span>{txn.source}</span>
                <span>→</span>
              {/if}
              <span>{txn.account}</span>
            </span>
            <span
              class='flex justify-evenly'
              class:col-span-3={txn.source}
              class:col-span-4={!txn.source}
            >
              <span>
                {txn.amount}
                <span class='font-mono font-light text-neutral-500 text-sm'>{txn.currency}</span>
              </span>
              {#if txn.currency !== $mainCurrency}
                <span>=</span>
                <span>
                  {Math.round(txn.rate * txn.amount)}
                  <span class='font-mono font-light text-neutral-500 text-sm'>{$mainCurrency}</span>
                </span>
              {/if}
            </span>
          </div>

          <div class='grid grid-cols-5'>
            <button
              class='font-semibold rounded-sm py-1 text-white bg-neutral-300'
              on:click={() => selectedTxnIdx = null}
            >
              Collapse
            </button>
            <button
              class='show-dialog-button col-start-3 font-semibold rounded-sm py-1 text-white'
              on:click={() => dialog.showModal()}
            >
              Edit
            </button>
            <button
              class='col-start-5 font-semibold rounded-sm py-1 text-white bg-green-500'
              on:click={() => {
                $lastIncome = txn
                selectedTxnIdx = null
              }}
            >
              Start
            </button>
          </div>
        </div>
        {:else}
          <!-- show truncated info -->
          <button
            class='grid grid-cols-6 w-full border border-transparent hover:border-black'
            on:click={() => selectedTxnIdx = idx}
          >
            <span>
              {txn.month + 1}-{txn.date}
            </span>
            <span class='truncate'>{txn.account}</span>
            <span class='col-span-2 flex justify-between'>
              <span>{txn.amount}</span>
              {#if txn.currency !== $mainCurrency}
                <span>({Math.round(txn.rate * txn.amount)})</span>
              {/if}
            </span>
            <span
              class='truncate col-span-2 text-right'
            >
              {txn.label}
            </span>
          </button>
        {/if}
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

  .show-dialog-button {
    transition: all 0.2s linear;
  }

  .show-dialog-button {
    color: white;
    background-color: var(--color-brand);
  }

  .show-dialog-button:hover {
    color: var(--color-brand);
    background-color: white;
  }
</style>
