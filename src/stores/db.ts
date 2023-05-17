/**
 * localStorage DB
 *
 * @note each item has max size of 5mb, around 5_000_000 chars on safari. This is roughly ~38k entries in CSV format, +50k minimized
 *
 * In the future, might need some way to split ledgers by account to save on space... or maybe use IndexedDB?
 */
import { writableStorage } from 'src/lib/writableStorage'
import type { Transaction } from 'src/lib/types'
import type { Subscriber, Updater, Writable } from 'svelte/store'
import { get, writable, derived } from 'svelte/store'


type DbShape = Record<string, Transaction[]>
// export const DB: Writable<DbShape> = (() => {
//   // This store is just in memory, but the values of each account are in localStorage.
//   // We need a way to initialize the value programmatically from localStorage, but we don't necesarily know the account names.
//   // by using the second arg, (fn subscriber) we can read the state of localStorage
//   const { subscribe, set: originalSet, update } = writable({}, () => {

//   })

//   // 2. tl;dr, update localStorage for modified entries, just update
//   return {
//     subscribe, update,
//     set: (newDbState: DbShape) => {

//       originalSet(newDbState)
//     }
//   }
// })()

/**
 * Because db is just in-memory, it has no reliable to discover which accounts are present in localStorage (each account maps 1:1 with a key)
 * Here we persist the keys in storage so we can repopulate between reloads
 */
export const knownAccounts = writableStorage('db/knownAccounts', [] as string[])

/**
 * collection (record) of writable stores mapped to strings.
 * when using this pattern, must be careful to not to update any of the storageKeys in localstorage elsewhere, or data will get desynced
 * suggestion: If needing to subscribe to the changes of just one of the values, use a derived store instead
 *
 * @note limitation: if the initial storageKeys array is updated, requires a page refresh to have new contents reflected
 */
function writableRecord<T>(storageKeys: string[], initialValue: T, localStoragePrefix = 'db/accounts'): Writable<T> {
  let value = !storageKeys.length ? initialValue : Object.fromEntries(storageKeys.map(suffix => {
    const localStorageKey = `${localStoragePrefix}/${suffix}`
    const startingValue = JSON.parse(localStorage.getItem(localStorageKey)) || localStorage.setItem(localStorageKey, '')
    return [suffix, startingValue || '']
  })) as T
  let subs: Subscriber<T>[] = []

  const subscribe = (handler: Subscriber<T>) => {
    subs = [...subs, handler]
    handler(value)
    return () => subs = subs.filter(sub => sub !== handler)
  }

  /**
   * Custom `set` function to write to all known stores
   *
   * @note must supply entire new value
   */
  const set = (newValue: T) => {
    value = newValue
    subs.forEach(sub => sub(value))

    Object.entries(value).map(([suffix, currentValue]) => {
      localStorage.setItem(
        `${localStoragePrefix}/${suffix}`,
        JSON.stringify(currentValue)
      )
    })
  }

  const update = (handler: Updater<T>) => set(handler(value))

  return { subscribe, set, update }
}
export const DB = writableRecord<DbShape>(get(knownAccounts), {})

// iterate all entries (across keys) & get flat, unsorted list of attribute
function getDbAttributes(db: DbShape, name: string) {
  return Object.entries(db).flatMap(([_accountName, transactions]) => transactions.map(txn => txn[name]))
}

/** list of actual accounts present, derived from parsed entries */
export const accounts = derived([DB], ([$DB]) => {
  return Array.from(new Set(getDbAttributes($DB, 'account')))
})

/** list of all known currencies, derived from parsed entries */
export const currencies = derived([DB], ([$DB]) => {
  return Array.from(new Set(getDbAttributes($DB, 'currency')))
})
