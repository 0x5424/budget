import type { Transaction } from './types'

export function byDate({ transactions, before, after }: { transactions: Transaction[], before?: Date, after?: Date }) {
  return transactions.reduce((out: Transaction[], txn) => {
    const txnDate = new Date(txn.year, txn.month, txn.date)
    if (before && txnDate >= before) return out // before = upper limit
    if (after && txnDate <= after) return out // after = lower limit

    out.push(txn)
    return out
  }, [])
}

export function greaterThan(transactions: Transaction[], amount: number) {
  return transactions.reduce((out: Transaction[], txn) => {
    if (txn.amount > amount) out.push(txn)

    return out
  }, [])
}

/**
 * given list of transactions, get biggest net inflow (positive)
 */
export function findLargestIncome({ before, after, transactions }: { before?: Date, after?: Date, transactions: Transaction[] }) {
   return greaterThan(byDate({ transactions, before, after }), 0).reduce((prevTxn, txn) => {
    // first iteration will be blank
    if (!prevTxn) return txn

    // (unlikely) Keep older txn if amounts match exactly
    if (prevTxn.amount === txn.amount) {
      const prevDate = new Date(prevTxn.year, prevTxn.month, prevTxn.date)
      const txnDate = new Date(txn.year, txn.month, txn.date)

      return prevDate > txnDate ? txn : prevTxn
    }

    // Finally, return current txn only if it's higher amount than previous
    const prevAmt = prevTxn.rate * prevTxn.amount
    const currAmt = txn.rate * txn.amount

    return prevAmt > currAmt ? prevTxn : txn
  }, null)
}
