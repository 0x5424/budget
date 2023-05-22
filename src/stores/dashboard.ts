/**
 * store for component states on the dashboard
 */

import { derived } from 'svelte/store'
import { txns } from './db'
import { lastIncomeDate, nextIncomeDate } from './finances'

/** start of the range used for calculations */
export const rangeStart = derived([lastIncomeDate, txns], ([$lastIncomeDate, $txns]) => {
  if (!$txns.length) return

  return $lastIncomeDate || new Date($txns.at(0).year, $txns.at(0).month, $txns.at(0).date)
})

/** end of the range used for calculations */
export const rangeEnd = derived([nextIncomeDate, txns], ([$nextIncomeDate, $txns]) => {
  if ($txns.length < 2) return // after 2, can start doing calcs

  return $nextIncomeDate || new Date($txns.at(-1).year, $txns.at(-1).month, $txns.at(-1).date)
})
