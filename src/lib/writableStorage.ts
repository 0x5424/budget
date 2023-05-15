// Code that's not specific to just this project.... should move to npm someday

import type { Writable } from 'svelte/store'

type Subscriber<T, R = void> = (v: T) => R
/** custom store API for shared writes/reads to localstorage. only supports objects that can be serialized with JSON.parse */
export function writableStorage<T>(localStorageKey: string, initialValue: T): Writable<T> {
  let value = JSON.parse(localStorage.getItem(localStorageKey)) || localStorage.setItem(localStorageKey, JSON.stringify(initialValue)) || initialValue
  let subs: Subscriber<T>[] = []

  const subscribe = (handler: Subscriber<T>) => {
    subs = [...subs, handler]
    handler(value)
    return () => subs = subs.filter(sub => sub !== handler)
  }

  /**
   * Custom `set` function to simultaneously write to localStorage
   *
   * @note must supply entire new value
   */
  const set = (newValue: T) => {
    value = newValue
    subs.forEach(sub => sub(value))

    localStorage.setItem(
      localStorageKey,
      JSON.stringify(value)
    )
  }

  /**
   * Store will provide the current `value` to the caller,
   * Caller is expected to return new state for `value`
   */
  const update = (handler: Subscriber<T, T>) => set(handler(value))

  return { subscribe, set, update }
}
