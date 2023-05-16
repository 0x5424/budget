/**
 * store used for calculating today's timestamp, should update
 */

import { writable } from 'svelte/store'

/**
 * there must be a better way...
 * @note re. why it's ugly: JST is +9, so when store is initialized before 9am it becomes previous day in calculations...
 *
 * @example initialize at Jan 1, 08:59 JST => Dec 31 23:59 UTC
 * and this causes the compairson of DateA === DateB to fail if DateB was initialized from a string like '2023-01-01'
 */
const TODAY = [
  `${(new Date()).getFullYear()}`,
  `${(new Date()).getMonth() + 1}`.padStart(2, '0'),
  `${(new Date()).getDate()}`.padStart(2, '0'),
].join('-').concat('T00:00:00Z')

/** Current day used for calculations */
export const today = writable(new Date(Date.parse(TODAY)))
