// calcs for dashboard

import type { Transaction } from 'src/lib/types'
import { today } from './today'
import { txns } from './db'
import { creditors } from './config'
import { derived } from 'svelte/store'

 /** assumption: most recent large income within last 31 days */
export const lastIncome = derived([today, txns] , ([$today, $txns]) => {
   return $txns.reduce((prevTxn, txn) => {
    if (txn.amount < 0) return prevTxn
    const txnDate = new Date(txn.year, txn.month, txn.date)

    // 1. skip txns in future
    if (txnDate > $today) return prevTxn // 1. skip txns in future

    const thirtyOneDaysAgo = (new Date($today.getTime() - 31 * 24 * 60 * 60 * 1000))
    if (txnDate < thirtyOneDaysAgo) return prevTxn // 2. skip old txns

    // 3. first iteration will be blank
    if (!prevTxn) return txn

    // 4. (unlikely) Keep older txn if amounts match exactly
    if (prevTxn.amount === txn.amount) {
      const prevDate = new Date(prevTxn.year, prevTxn.month, prevTxn.date)

      return prevDate > txnDate ? txn : prevTxn
    }

    // 4. Finally, return current txn only if it's higher amount than previous
    const prevAmt = prevTxn.rate * prevTxn.amount
    const currAmt = txn.rate * txn.amount

    return prevAmt > currAmt ? prevTxn : txn
  }, null)
})

/** assumption: next large income within 1 month from previous income */
export const nextIncome = derived([lastIncome, txns] , ([$lastIncome, $txns]) => {
  return $txns.reduce((prevTxn, txn) => {
    if (txn.amount < 0) return prevTxn

    const lastIncomeDate = new Date($lastIncome.year, $lastIncome.month, $lastIncome.date)
    const txnDate = new Date(txn.year, txn.month, txn.date)

    if (txnDate <= lastIncomeDate) return prevTxn // 1. skip txns before (& including) last income

    const oneMonthLater = new Date($lastIncome.year, $lastIncome.month + 1, $lastIncome.date)
    if (txnDate > oneMonthLater) return prevTxn // 2. skip txns more than amonth after last income

    // 3. first iteration will be blank
    if (!prevTxn) return txn

    // 4. (unlikely) Keep newer txn if amounts match exactly
    if (prevTxn.amount === txn.amount) {
      const prevDate = new Date(prevTxn.year, prevTxn.month, prevTxn.date)

      return prevDate < txnDate ? txn : prevTxn
    }

    // 4. Finally, return current txn only if it's higher amount than previous
    const prevAmt = prevTxn.rate * prevTxn.amount
    const currAmt = txn.rate * txn.amount

    return prevAmt > currAmt ? prevTxn : txn
  }, null)
})

export const lastIncomeDate = derived([lastIncome], ([$lastIncome]) => $lastIncome && new Date($lastIncome.year, $lastIncome.month, $lastIncome.date))
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
 * @todo this calc needs to be fixed when there is a "transfer" of money from 1 account to another
 * @example the following ledger would be wrong:
 * 4-20: +1000 to account `cash`
 * 4-21:  -500 from account `cash` (sending to `savings`)
 * 4-21:  +500 to account `savings`
 *
 * balance mistakenly reported as 1500
 *
 * @workaround if a destination account is a `creditor`, we know to omit a repayment.
 * @example assuming account `card` is a creditor, this would correctly report 1000
 * 4-20: +1000 to account `cash`
 * 4-21:  -500 from account `cash` (repaying creditor `card`)
 * 4-21:  +500 to account `card`
 */
export const currentPeriodIncome = derived([currentPeriodTransactions, creditors], ([$currentPeriodTransactions, $creditors]) => {
  return $currentPeriodTransactions.reduce((out, txn) => {
    if (txn.amount < 0) return out

    // app logic: omit creditor repayments
    if ($creditors.includes(txn.account)) return out

    // app logic: omit transfers
    // (todo)

    out.push(txn)
    return out
  }, [] as Transaction[])
})