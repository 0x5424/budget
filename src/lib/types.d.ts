/**
 * Rate is arbitrary, but **MUST** always be relative to the same currency.
 *
 * @example If opting to base against USD all subsequent txns should use a rate relative to USD, FOREVER!! (known limitation)
 *
 * @note-to-future-self this is an active design choice......... don't preoptimize plz.............................................
 */
type Rate = 1 | number

/**
 * ledger entry; semantics+usage will vary based on account name, amount, and app settings.
 *
 * @example account is designated as creditor:
 * - Negative entries are debits
 * - Positive entries are repayments
 *
 * @example account is _not_ a creditor:
 * - Negative entries are cash txns
 * - Positive entries are income
 */
export type Transaction = {
  year: number
  month: number
  date: number // "Number date", NOT "Day of week"
  currency: string
  account: string
  amount: number
  rate: Rate
  label?: string
}
