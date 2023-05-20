// calcs for dashboard

import { today } from './today'
import { txns } from './db'
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
    // edge case: no lastIncome = no txns
    if (!$lastIncome) return

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

export const lastIncomeDate = derived([lastIncome], ([$lastIncome]) => new Date($lastIncome.year, $lastIncome.month, $lastIncome.date))
export const nextIncomeDate = derived([nextIncome], ([$nextIncome]) => new Date($nextIncome.year, $nextIncome.month, $nextIncome.date))





