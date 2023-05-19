/** ledger is the main import, all txns  */
const LEDGER_HEADERS = ['date', 'currency', 'amount', 'rate', 'account', 'label'] as const

import type { Transaction } from './types'

/**
 * very rudimentary CSV parser... worx 4 now tho
 *
 * @warning breaks if any column has a comma
 * @warning probably doesn't work on windows
 * @warning also requires headers to be present
 * @warning only returns string values
 * @warning only meant to be intermediary parser
 */
function parse(str: string): Record<string, string>[] {
  const normalizedString = [str, ''].join('\n') // append newline "just in case"

  // assume header row is first row
  const [rawHeaders, ...rawRows] = normalizedString.split('\n')
  const headers = rawHeaders.split(',')

  return rawRows.reduce((out, rowString) => {
    const values = rowString.split(',')
    const asObject = Object.fromEntries(headers.map((key, idx) => [key, values[idx]]))

    out.push(asObject)
    return out
  }, [])
}

export function parseLedger(rawCsv: string): Transaction[] {
  const parsed = parse(rawCsv)

  return parsed.reduce((out, rawObj) => {
    const rawDate = rawObj.date
    // on final newlines, date will b empty
    if (!rawDate || rawDate === '') return out

    const txn: Transaction = {
      year: Number(rawDate.slice(0, 4)),
      month: Number(rawDate.slice(4, 6)) - 1,
      date: Number(rawDate.slice(6, 8)),
      amount: Number(rawObj.amount),
      rate: Number(rawObj.rate),
      currency: rawObj.currency,
      account: rawObj.account
    }

    const { label } = rawObj
    if (label && label !== '') txn['label'] = label

    out.push(txn)
    return out
  }, [])
}

export function stringifyLedger(txns: Transaction[]): string {
  // sort it just to be nice
  const sortedAndFormatted = txns.sort((txnA, txnB) => {
    const dateA = new Date(txnA.year, txnA.month, txnA.date)
    const dateB = new Date(txnB.year, txnB.month, txnB.date)

    return 0 - Number(dateA > dateB)
  }).reduce((out, txn) => {
    const asRow = LEDGER_HEADERS.map((key) => {
      if (key === 'date') {
        return [
          txn.year,
          `${txn.month + 1}`.padStart(2, '0'),
          `${txn.date}`.padStart(2, '0')
        ].join('')
      }

      return txn[key] || ''
    }).join(',')

    out.unshift(asRow)
    return out
  }, [])

  // add headers
  sortedAndFormatted.unshift(LEDGER_HEADERS.join('\,'))

  // then add a newline to be pessimistic
  sortedAndFormatted.push('\n')
  return sortedAndFormatted.join('\n')
}
