/**
 * set up which accounts are creditors, whether they charge interest, etc.
 *
 * reason for labeling as a config: the DB shape has no column for creditor status
 */

import { writableStorage } from 'src/lib/writableStorage'
import { currencies } from './db'
import { get } from 'svelte/store'

/**
 * If associated accounts can have a balance (eg. a credit card, or a personal loan)
 *
 * If an account is absent from this list, it's assumed to be cash
 */
export const creditors = writableStorage('config/creditors', [] as string[])

/**
 * By default, app assumes creditors will charge interest. By specifying an account in this list,
 * the user has a "high-trust debtor" status for that account. Their credit payments will not appear in the next month's balance sheet.
 *
 * @example New credit cards with a 0% APR for the first year
 */
export const trustedCreditors = writableStorage('config/trustedCreditors', [] as string[])

/**
 * Affects how exchange rates behave... will document more later
 */
export const mainCurrency = writableStorage('config/mainCurrency', get(currencies)[0])
