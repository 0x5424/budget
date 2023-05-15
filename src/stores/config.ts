/**
 * app-wide config, used for:
 * - minimal routing
 * - database
 */

import { writableStorage } from 'src/lib/writableStorage'

const ALL_PAGES = ['DASHBOARD', 'INPUT', 'CONFIG'] as const

/** export current, most recent page (should persist between refresh) */
export const currentPage = writableStorage<typeof ALL_PAGES[number]>('config/currentPage', ALL_PAGES[0])
