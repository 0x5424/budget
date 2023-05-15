/**
 * app-wide routing, a minimal implementation
 */

import { writableStorage } from 'src/lib/writableStorage'

export const ALL_PAGES = ['DASHBOARD', 'INPUT', 'CONFIG'] as const

/** export current, most recent page (should persist between refresh) */
export const currentPage = writableStorage<typeof ALL_PAGES[number]>('routing/currentPage', ALL_PAGES[0])
