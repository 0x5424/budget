// calcs for dashboard

import type { Transaction } from 'src/lib/types'
import { findLargestIncome } from 'src/lib/filters'
import { today } from './today'
import { txns } from './db'
import { creditors } from './config'
import { derived } from 'svelte/store'

 /** assumption: most recent large income within last 31 days */
export const lastIncome = derived([today, txns], ([$today, $txns]) => {
  const thirtyOneDaysAgo = (new Date($today.getTime() - 31 * 24 * 60 * 60 * 1000))
  return findLargestIncome({ before: $today, after: thirtyOneDaysAgo, transactions: $txns })
})
export const lastIncomeDate = derived([lastIncome], ([$lastIncome]) => $lastIncome && new Date($lastIncome.year, $lastIncome.month, $lastIncome.date))

/** assumption: next large income within 1 month from previous income */
export const nextIncome = derived([lastIncomeDate, txns] , ([$lastIncomeDate, $txns]) => {
  // edge case: no txns
  if (!$lastIncomeDate) return

  // make sure to exclude income day itself, or it gets returned
  const cutoff = new Date($lastIncomeDate.getTime() + 24 * 60 * 60 * 1000)
  const oneMonthLater = new Date(cutoff.getFullYear(), cutoff.getMonth() + 1, cutoff.getDate())
  return findLargestIncome({ before: oneMonthLater, after: cutoff, transactions: $txns })
})
export const nextIncomeDate = derived([nextIncome], ([$nextIncome]) => $nextIncome && new Date($nextIncome.year, $nextIncome.month, $nextIncome.date))

/** definition: all transactions before most recent income */
export const previousTransactions = derived([lastIncomeDate, txns], ([$lastIncomeDate, $txns]) => {
  return $txns.reduce((out, txn) => {
    const txnDate = new Date(txn.year, txn.month, txn.date)
    if (txnDate >= $lastIncomeDate) return out // on or before most recent income

    out.push(txn)
    return out
  }, [])
})

/**
 * definition: all txns between last income & next income. if nextIncome absent, today
 * @note excludes all txns on the nextIncome day
 */
export const currentPeriodTransactions = derived([lastIncomeDate, today, nextIncomeDate, txns], ([$lastIncomeDate, $today, $nextIncomeDate, $txns]) => {
  // edge case: no lastIncome = no txns
  if (!$lastIncomeDate) return []

  const endDate = $nextIncomeDate || $today

  return $txns.reduce((out, txn) => {
    const txnDate = new Date(txn.year, txn.month, txn.date)

    if (txnDate < $lastIncomeDate) return out
    if (txnDate >= endDate) return out
    out.push(txn)

    return out
  }, [] as Transaction[])
})

// BEGIN STORES DERIVED FROM APPLICATION CONFIG

/**
 * definition: all incoming cash for the current period
 *
 * @note omits all payments with a `source` key
 */
export const currentPeriodIncome = derived([currentPeriodTransactions, creditors], ([$currentPeriodTransactions, $creditors]) => {
  return $currentPeriodTransactions.reduce((out, txn) => {
    if (txn.amount < 0) return out

    // app logic: omit creditor repayments
    if ($creditors.includes(txn.account)) return out

    // app logic: omit transfers
    if (txn.source) return out

    out.push(txn)
    return out
  }, [] as Transaction[])
})

/**
 * all immediate "cash" outflows
 *
 * @note expenses made on credit are deferred to next month
 */
export const currentPeriodExpenses = derived([currentPeriodTransactions, creditors], ([$currentPeriodTransactions, $creditors]) => {
  return $currentPeriodTransactions.reduce((out, txn) => {
    if (txn.amount > 0) return out

    // app logic: omit charges made on credit
    if ($creditors.includes(txn.account)) return out

    out.push(txn)
    return out
  }, [] as Transaction[])
})

/** all expenses made on credit for current period (maybe there's a better name) */
export const currentPeriodDebts = derived([currentPeriodTransactions, creditors], ([$currentPeriodTransactions, $creditors]) => {
  return $currentPeriodTransactions.reduce((out, txn) => {
    if (txn.amount > 0) return out

    // app logic: include charges made on credit
    if ($creditors.includes(txn.account)) out.push(txn)

    return out
  }, [] as Transaction[])
})

/** all txns repaying debt */
export const currentPeriodRepayments = derived([currentPeriodTransactions, creditors], ([$currentPeriodTransactions, $creditors]) => {
  return $currentPeriodTransactions.reduce((out, txn) => {
    // repayments should all be positive
    if (txn.amount < 0) return out
    if ($creditors.includes(txn.account)) out.push(txn)

    return out
  }, [] as Transaction[])
})

function sum(txns: Transaction[]) {
  return txns.reduce((out, txn) => out += txn.rate * txn.amount, 0)
}

/** sum the "effective" transactions for the current period */
export const disposableIncome = derived([currentPeriodIncome, currentPeriodRepayments, currentPeriodExpenses], ([$currentPeriodIncome, $currentPeriodRepayments, $currentPeriodExpenses]) => {
  return sum($currentPeriodIncome) - sum($currentPeriodRepayments) + sum($currentPeriodExpenses)
})
