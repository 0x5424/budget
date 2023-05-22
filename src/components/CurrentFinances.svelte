<script lang=ts>
  import type { Transaction } from 'src/lib/types'
  import { today, currentPeriodIncome, lastIncomeDate, accounts } from 'src/stores'
  import { lastIncome, nextIncome, currentPeriodTransactions, currentPeriodExpenses, currentPeriodDebts, currentPeriodRepayments, netCashFlow, disposableIncome, previousBalance, currentBalance } from 'src/stores'
  import { onMount } from 'svelte'

  function sum(txns: Transaction[]) {
    return txns.reduce((out, txn) => out += txn.rate * txn.amount, 0)
  }

  function round(arg: Transaction[] | number) {
    if (typeof arg === 'number') return Math.round(arg)
    return Math.round(sum(arg))
  }

  // take a float representation (eg. 0.335) => 33.5
  function percent(num: number, trailing = 1): string {
    return Number.parseFloat(String(100.0 * Math.abs(num))).toFixed(trailing)
  }

  // special fn; deduct from balances that reference the account name in `source`
  function accountBalance(account: string, periodTxns: Transaction[]) {
    return Math.round(periodTxns.reduce((out, txn) => {
      // edge case: same account & source == no-op
      if (txn.account === txn.source) return out

      // if the txn mentions `source`, it's a debit from that account
      if (txn.source === account) {
        return out -= txn.rate * txn.amount
      }

      // if the txn mentions only account, can be either
      if (txn.account === account) {
        return out += txn.rate * txn.amount
      }

      return out
    }, 0))
  }

  // show a single date or a range
  $: currentPeriodTitle = $lastIncome && [
    `${$lastIncome.month + 1}/${$lastIncome.date}`,
    $nextIncome && `to ${$nextIncome.month + 1}/${$nextIncome.date}`,
    'income'
  ].filter(Boolean).join(' ')

  $: income = sum($currentPeriodIncome)

  $: startDate = $lastIncomeDate
  $: endDate = new Date()
  $: dayDiff = !startDate ? 1 : (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)

  $: expensesOnCredit = sum($currentPeriodDebts)
  $: expensesAuxillary = sum($currentPeriodExpenses)
  $: newExpenses = expensesAuxillary + expensesOnCredit

  onMount(() => {
    const interval = setInterval(() => endDate = new Date(), 5000)

    return () => clearInterval(interval)
  })
</script>

<article class='container max-w-md mx-auto px-4'>
  <fieldset class='border px-4 py-3'>
    <legend>Finances, {$today.toDateString()}</legend>
    {#if $lastIncome}
      <dl class='grid grid-cols-4 gap-y-2'>
        <div class='col-span-2'>
          <dt>Previous balance</dt>
          <dd>{round($previousBalance)}</dd>
        </div>
        <div class='col-span-2'>
          <dt>{currentPeriodTitle}</dt>
          <dd>{round(income)}</dd>
        </div>
        <div class='col-span-2'>
          <dt>Cash expenses</dt>
          <dd>{round(expensesAuxillary)} <span class='text-xs md:text-sm font-normal'>{percent(expensesAuxillary / income)}%</span></dd>
          <dd class='text-gray-500 text-sm'>{Math.abs(expensesAuxillary / dayDiff).toFixed(2)} / day</dd>
        </div>
        <div class='col-span-2'>
          <dt>Expenses on credit</dt>
          <dd>{round(expensesOnCredit)} <span class='text-xs md:text-sm font-normal'>{percent(expensesOnCredit / income)}%</span></dd>
          <dd class='text-gray-500 text-sm'>{Math.abs(expensesOnCredit / dayDiff).toFixed(2)} / day</dd>
        </div>
        <div class='col-span-2'>
          <dt>Credit repayments</dt>
          <dd>{round($currentPeriodRepayments)} <span class='text-xs md:text-sm font-normal'>{percent(sum($currentPeriodRepayments) / income)}%</span></dd>
        </div>
        <div class='col-span-2'>
          <dt>New this period</dt>
          <dd>{round(newExpenses)} <span class='text-xs md:text-sm font-normal'>{percent(newExpenses / income)}%</span></dd>
          <dd class='text-gray-500 text-sm'>{Math.abs(newExpenses / dayDiff).toFixed(2)} / day</dd>
          <dd class='text-gray-500 text-sm'>{percent(Math.abs(newExpenses / dayDiff) / income, 2)}% / day</dd>
        </div>
        <div class='col-span-1'>
          <dt class='text-lg'>Disposable</dt>
          <dd>{round($disposableIncome)}</dd>
          <dd class='text-gray-500 text-sm'>{percent(($disposableIncome - Math.abs($disposableIncome < 0 ? income : 0)) / income)}%</dd>
        </div>
        <div class='text-right col-span-1'>
          <dt class='text-lg'>Net</dt>
          <dd>{round($netCashFlow)} <span class='text-xs md:text-sm font-normal'>{percent($netCashFlow / income)}%</span></dd>
        </div>
        <div class='text-right mr-6 col-span-2'>
          <dt class='text-lg'>New Balance</dt>
          <dd>{round($currentBalance)}</dd>
          <dd
            class='text-xs'
            class:text-green-600={$currentBalance > $previousBalance}
            class:text-red-600={$currentBalance < $previousBalance}
          >
            <span class='font-normal font-sans'>{percent($currentBalance / $previousBalance)}% of previous balance</span>
          </dd>
        </div>
      </dl>

      <hr class=my-3 />

      <dl class='grid grid-cols-4 gap-y-2'>
        {#each $accounts as account}
          <div class='col-span-2'>
            <dt class='term-account'>{account}</dt>
            <dd>{accountBalance(account, $currentPeriodTransactions)}</dd>
          </div>
        {/each}
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
