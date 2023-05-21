/**
 * Rate **MUST** always be relative to the same currency.
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

const OMIT_FILTER_CONDITIONS = ['dateIs', 'amountGreaterThan', 'amountLessThan', 'labelIncludes'] as const

/** @todo document this more betterer someday */
type OmitFilterShape<ID extends typeof OMIT_FILTER_CONDITIONS[number], P> = {
  condition: ID
  param: P
}

type OmitDateIs = OmitFilterShape<'dateIs', number>
type OmitAmountGreaterThan = OmitFilterShape<'amountGreaterThan', number>
type OmitAmountLessThan = OmitFilterShape<'amountLessThan', number>
type OmitLabelIncludes = OmitFilterShape<'labelIncludes', string>

type OmitFilterCondition = Readonly<OmitDateIs | OmitAmountGreaterThan | OmitAmountLessThan | OmitLabelIncludes>

/**
 * Any transaction matching the filter condition won't be included in `income` calculations
 *
 * income definition: any transaction with a positive balance considered a significant addition to balance
 *
 * @note conditions are either "all or none" or "any"
  *
 * @example Label includes the text "Transfer", it could be sending between 2 cash accounts
 * @example Label includes "Used my card at dinner with friends and they venmo'd me back", it could be a reimbursement
 * @example Label includes "Cash from the dogecoin I sold", it could be a currency swap w/ an equal subtraction from the `doge` account (if it exists)
 */
export type OmitIncomeFilter = {
  label?: string // arbitrary label
  accounts?: string[] // Applicable to only the specified accounts. Absence implies it's "global"
  operator: 'AND' | 'OR' // aka. "all" or "any", respectively
  conditions: OmitFilterCondition[]
}
