// calcs for dashboard

import type { Transaction } from 'src/lib/types'
import { byDate, findLargestIncome, greaterThan, lessThan, omitValues, keepValues } from 'src/lib/filters'
import { today } from './today'
import { txns } from './db'
import { creditors } from './config'
import { derived, writable, get } from 'svelte/store'

 /** assumption: most recent large income within last 31 days */
function getDefaultLastIncome() {
  const thirtyOneDaysAgo = new Date(get(today).getTime() - 31 * 24 * 60 * 60 * 1000)
  return findLargestIncome({ before: get(today), after: thirtyOneDaysAgo, transactions: get(txns) })
}
export const lastIncome = writable(getDefaultLastIncome())
export const lastIncomeDate = derived([lastIncome], ([$lastIncome]) => $lastIncome && new Date($lastIncome.year, $lastIncome.month, $lastIncome.date))

/** assumption: next large income within 31 days of previous income */
function getDefaultNextIncome() {
  const startDate = get(lastIncomeDate)
  // edge case: no txns
  if (!startDate) return

  const thirtyOneDaysLater = new Date(startDate.getTime() + 31 * 24 * 60 * 60 * 1000)
  return findLargestIncome({ before: thirtyOneDaysLater, after: startDate, transactions: get(txns) })
}
export const nextIncome = writable(getDefaultNextIncome())
export const nextIncomeDate = derived([nextIncome], ([$nextIncome]) => $nextIncome && new Date($nextIncome.year, $nextIncome.month, $nextIncome.date))

/** definition: all transactions before most recent income */
export const previousTransactions = derived([lastIncomeDate, txns], ([$lastIncomeDate, $txns]) => {
  return byDate({ transactions: $txns, before: $lastIncomeDate })
})

/**
 * definition: all txns between last income & next income. if nextIncome absent, today
 * @note excludes all txns on the nextIncome day
 */
export const currentPeriodTransactions = derived([lastIncomeDate, today, nextIncomeDate, txns], ([$lastIncomeDate, $today, $nextIncomeDate, $txns]) => {
  // edge case: no lastIncome = no txns
  if (!$lastIncomeDate) return []

  // sub 1 day to actually include the lastIncomeDate, as `byDate` is exclusive range
  const startDate = new Date(($lastIncomeDate).getTime() - 24 * 60 * 60 * 1000)
  const endDate = ($nextIncomeDate || $today)

  return byDate({ transactions: $txns, after: startDate, before: endDate })
})

// BEGIN STORES DERIVED FROM APPLICATION CONFIG

/**
 * definition: all incoming cash for the current period
 *
 * @note omits all payments with a `source` key
 */
export const currentPeriodIncome = derived([currentPeriodTransactions, creditors], ([$currentPeriodTransactions, $creditors]) => {
  return omitValues({
    transactions: greaterThan(0, $currentPeriodTransactions).filter(({ source }) => !source),
    key: 'account',
    omit: $creditors
  })
})

/**
 * all immediate "cash" outflows
 *
 * @note expenses made on credit are deferred to next month
 */
export const currentPeriodExpenses = derived([currentPeriodTransactions, creditors], ([$currentPeriodTransactions, $creditors]) => {
  return omitValues({
    transactions: lessThan(0, $currentPeriodTransactions),
    key: 'account',
    omit: $creditors
  })
})

/** all expenses made on credit for current period (maybe there's a better name) */
export const currentPeriodDebts = derived([currentPeriodTransactions, creditors], ([$currentPeriodTransactions, $creditors]) => {
  return keepValues({
    transactions: lessThan(0, $currentPeriodTransactions),
    key: 'account',
    keep: $creditors
  })
})

/** all txns repaying debt */
export const currentPeriodRepayments = derived([currentPeriodTransactions, creditors], ([$currentPeriodTransactions, $creditors]) => {
  return keepValues({
    transactions: greaterThan(0, $currentPeriodTransactions),
    key: 'account',
    keep: $creditors
  })
})

function sum(txns: Transaction[]) {
  return txns.reduce((out, txn) => out += txn.rate * txn.amount, 0)
}

/** "effective" net expenses. (omits payments on credit for this period) */
export const expensesAndRepayments = derived([currentPeriodRepayments, currentPeriodExpenses], ([$currentPeriodRepayments, $currentPeriodExpenses]) => {
  return sum($currentPeriodExpenses) - sum($currentPeriodRepayments)
})

/** disposable income left over after expenses and repayments (expenses = excludes credit) */
export const disposableIncome = derived([currentPeriodIncome, expensesAndRepayments], ([$currentPeriodIncome, $expensesAndRepayments]) => {
  return sum($currentPeriodIncome) + $expensesAndRepayments
})

/** excluding repayments, the total net cash "saved" this period */
export const netCashFlow = derived([currentPeriodIncome, currentPeriodExpenses, currentPeriodDebts], ([$currentPeriodIncome, $currentPeriodExpenses, $currentPeriodDebts]) => {
  return sum($currentPeriodIncome) + sum($currentPeriodExpenses) + sum($currentPeriodDebts)
})

/** absolute state of profit/debt; omits all balance transfers */
export const previousBalance = derived([previousTransactions], ([$previousTransactions]) => {
  return sum($previousTransactions.filter(({ source }) => !source))
})

/** absolute state for current period; also equivalent: Sum of previousBalance + netCashFlow */
export const currentBalance = derived([previousBalance, currentPeriodTransactions], ([$previousBalance, $currentPeriodTransactions]) => {
  return $previousBalance + sum($currentPeriodTransactions.filter(({ source }) => !source))
})
