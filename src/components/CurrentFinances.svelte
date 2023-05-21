<script lang=ts>
  import type { Transaction } from 'src/lib/types'
  import { today, currentPeriodIncome } from 'src/stores'
  import { lastIncome, nextIncome, previousTransactions, currentPeriodExpenses, currentPeriodDebts, currentPeriodRepayments, disposableIncome } from 'src/stores'

  function sum(txns: Transaction[]) {
    return txns.reduce((out, txn) => out += txn.rate * txn.amount, 0)
  }

  function round(txns: Transaction[]) {
    return Math.round(sum(txns))
  }

  // show a single date or a range
  $: currentPeriodTitle = $lastIncome && [
    `${$lastIncome.month + 1}/${$lastIncome.date}`,
    $nextIncome && `to ${$nextIncome.month + 1}/${$nextIncome.date}`,
    'income'
  ].filter(Boolean).join(' ')
</script>

<article class='container max-w-md mx-auto px-4'>
  <fieldset class='border px-4 py-3'>
    <legend>Finances, {$today.toDateString()}</legend>
    {#if $lastIncome}
      <dl class='grid grid-cols-4 gap-y-2'>
        <div class='col-span-2'>
          <dt>Previous balance</dt>
          <dd>{round($previousTransactions)}</dd>
        </div>
        <div class='col-span-2'>
          <dt>{currentPeriodTitle}</dt>
          <dd>{round($currentPeriodIncome)}</dd>
        </div>
        <div class='col-span-2'>
          <dt>Expenses on credit</dt>
          <dd>{round($currentPeriodDebts)}</dd>
        </div>
        <div class='col-span-2'>
          <dt>Credit repayments</dt>
          <dd>{-1 * round($currentPeriodRepayments)}</dd>
        </div>
        <div class='col-span-3 col-start-2'>
          <dt>Auxillary expenses</dt>
          <dd>{round($currentPeriodExpenses)}</dd>
        </div>
        <div class='col-span-3 col-start-2'>
          <dt class='text-lg'>Disposable Income</dt>
          <dd>{Math.round($disposableIncome)}</dd>
        </div>
      </dl>
    {/if}
  </fieldset>
</article>

<style>
  dt {
    font-weight: 200;
  }

  dd {
    margin-left: 1.75rem;
    font-weight: 500;
    font-family: var(--font-mono);
  }
</style>
