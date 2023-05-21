/**
 * localStorage DB
 *
 * @note each item has max size of 5mb, around 5_000_000 chars on safari. This is roughly ~38k entries in CSV format, +50k minimized
 *
 * In the future, might need some way to split ledgers by account to save on space... or maybe use IndexedDB?
 */
import { writableStorage } from 'src/lib/writableStorage'
import type { Transaction } from 'src/lib/types'
import type { Subscriber, Updater } from 'svelte/store'
import { get, derived } from 'svelte/store'


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

/** small helper function to skip updating localstorage for non-updated values */
function shouldUpdateTransactionStore(oldState: Transaction[], newState: Transaction[]) {
  const sortedA = JSON.stringify([...oldState].sort())
  const sortedB = JSON.stringify([...newState].sort())

  return sortedA !== sortedB
}

/**
 * collection accountNames mapped to namespaced stores
 */
function namespacedDb(accountNames: string[], initialValue: {}) {
  let value = !accountNames.length ? initialValue : Object.fromEntries(accountNames.map(accountName => {
    // Iterate all months (0-indexed) and populate the store if there's a localstorage key present.
    // This is done to save on storage space, as we are able to persist ~12*38k entries in total
    // (still a slight preoptimization...................................)
    //
    // ...don't laugh
    const startingValue = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].reduce((out, monthIndex) => {
      const localValue = localStorage.getItem(`db/accounts/${accountName}/${monthIndex}`)
      if (!localValue) return out

      /** @todo deserialization */
      return [...out, ...JSON.parse(localValue)]
    }, [] as Transaction[])

    return [accountName, startingValue]
  }))
  let subs: Subscriber<DbShape>[] = []

  const subscribe = (handler: Subscriber<DbShape>) => {
    subs = [...subs, handler]
    handler(value)
    return () => subs = subs.filter(sub => sub !== handler)
  }

  /**
   * Custom `set` function to write to all known stores
   *
   * @note must supply entire new value
   */
  const set = (newValue: DbShape) => {
    value = newValue
    subs.forEach(sub => sub(value))

    Object.entries(value).map(([accountName, transactions]: [string, Transaction[]]) => {
      // group by month, to perform least amount of writes to localStorage
      const partitionedTransactions = transactions.reduce((out, txn) => {
        if (!out.has(txn.month)) out.set(txn.month, [])
        out.get(txn.month).push(txn)

        return out
      }, new Map<number, Transaction[]>())

      // update localStorage per month of the year
      Array.from(partitionedTransactions.entries()).forEach(([month, txns]) => {
        const keyName = `db/accounts/${accountName}/${month}`

        /** @todo serialize value before saving to localStorage, saving more space */
        const currentState = JSON.parse(localStorage.getItem(keyName)) || []
        const shouldUpdate = shouldUpdateTransactionStore(currentState, txns)

        if (!shouldUpdate) return // skip redundant localStorage updates

        const newState = JSON.stringify([ ...currentState, ...txns ])

        localStorage.setItem(keyName, newState)
      })
    })
  }

  const update = (handler: Updater<DbShape>) => set(handler(value))

  // Add single entry (uses direct object mutation)
  const add = (txn: Transaction) => {
    if (!value[txn.account]) value[txn.account] = [txn]
    if (value[txn.account]) value[txn.account].push(txn)

    set(value)
  }

  /**
   * Cleanup localStorage, removing all currently known accounts.
   *
   * @note After cleaning storage, if `set()` isn't called again db state will be lost upon reload
   */
  const cleanStorage = () => {
    Object.keys(value).forEach(accountName => {
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].forEach((monthIndex) => {
        localStorage.removeItem(`db/accounts/${accountName}/${monthIndex}`)
      })
    })
  }

  return { subscribe, set, update, add, cleanStorage }
}
export const DB = namespacedDb(get(knownAccounts), {})

// iterate all entries & get flat, unsorted list of attributes
function getDbAttributes(transactions: Transaction[], name: string) {
  return transactions.map(txn => txn[name])
}

/** list of all transactions, in order */
export const txns = derived([DB], ([$DB]) => {
  return Object.entries($DB).flatMap(([_,txn]) => txn).sort((a, b) => {
    const dateA = new Date(a.year, a.month, a.date)
    const dateB = new Date(b.year, b.month, b.date)

    return 0 - Number(dateA < dateB)
  })
})

/** list of actual accounts present, derived from parsed entries */
export const accounts = derived([txns], ([$txns]) => {
  return Array.from(new Set(getDbAttributes($txns, 'account')))
})

/** list of all known currencies, derived from parsed entries */
export const currencies = derived([txns], ([$txns]) => {
  return Array.from(new Set(getDbAttributes($txns, 'currency')))
})
