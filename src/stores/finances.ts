// calcs for dashboard

import type { Transaction } from 'src/lib/types'
import { byDate, findLargestIncome, greaterThan, lessThan, omitValues, keepValues } from 'src/lib/filters'
import { today } from './today'
import { txns } from './db'
import { creditors } from './config'
import { derived } from 'svelte/store'

 /** assumption: most recent large income within last 31 days */
export const lastIncome = derived([today, txns], ([$today, $txns]) => {
  const thirtyOneDaysAgo = new Date($today.getTime() - 31 * 24 * 60 * 60 * 1000)
  return findLargestIncome({ before: $today, after: thirtyOneDaysAgo, transactions: $txns })
})
export const lastIncomeDate = derived([lastIncome], ([$lastIncome]) => $lastIncome && new Date($lastIncome.year, $lastIncome.month, $lastIncome.date))

/** assumption: next large income within 31 days of previous income */
export const nextIncome = derived([lastIncomeDate, txns] , ([$lastIncomeDate, $txns]) => {
  // edge case: no txns
  if (!$lastIncomeDate) return

  const thirtyOneDaysLater = new Date($lastIncomeDate.getTime() + 31 * 24 * 60 * 60 * 1000)
  return findLargestIncome({ before: thirtyOneDaysLater, after: $lastIncomeDate, transactions: $txns })
})
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

/** sum the "effective" transactions for the current period */
export const disposableIncome = derived([currentPeriodIncome, currentPeriodRepayments, currentPeriodExpenses], ([$currentPeriodIncome, $currentPeriodRepayments, $currentPeriodExpenses]) => {
  return sum($currentPeriodIncome) - sum($currentPeriodRepayments) + sum($currentPeriodExpenses)
})
