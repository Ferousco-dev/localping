type CacheEntry<T> = {
  value: T
  expiresAt: number
}

const memoryCache = new Map<string, CacheEntry<unknown>>()
const DEFAULT_TTL = 1000 * 60 * 5

function now() {
  return Date.now()
}

function getStorageEntry<T>(key: string): CacheEntry<T> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as CacheEntry<T>
  } catch {
    return null
  }
}

function setStorageEntry<T>(key: string, entry: CacheEntry<T>) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(key, JSON.stringify(entry))
}

export function getCache<T>(key: string): T | null {
  const memory = memoryCache.get(key) as CacheEntry<T> | undefined
  if (memory && memory.expiresAt > now()) return memory.value

  const stored = getStorageEntry<T>(key)
  if (stored && stored.expiresAt > now()) {
    memoryCache.set(key, stored)
    return stored.value
  }

  return null
}

export function setCache<T>(key: string, value: T, ttl = DEFAULT_TTL) {
  const entry: CacheEntry<T> = { value, expiresAt: now() + ttl }
  memoryCache.set(key, entry)
  setStorageEntry(key, entry)
}

export function invalidateCache(key: string) {
  memoryCache.delete(key)
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(key)
}
