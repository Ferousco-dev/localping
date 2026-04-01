import type { NewsItem, NotificationItem, Source, User } from './types'

const KEYS = {
  users: 'localping_users',
  currentUser: 'localping_current_user',
  likes: 'localping_likes',
  bookmarks: 'localping_bookmarks',
  sources: 'localping_sources',
  following: 'localping_following',
  notifications: 'localping_notifications',
  customNews: 'localping_custom_news',
  deletedNews: 'localping_deleted_news',
  newsCache: 'localping_news_cache',
  apiUpdatesEnabled: 'localping_api_updates_enabled',
}

type NewsCache = {
  location: string
  timestamp: number
  items: NewsItem[]
}

const defaultSources: Source[] = [
  {
    id: 'lagos-daily',
    name: 'Lagos Daily',
    description: 'Metro updates, transport, and local policy coverage.',
    url: 'https://example.com/lagos-daily',
    enabled: true,
  },
  {
    id: 'mainland-brief',
    name: 'Mainland Brief',
    description: 'Business, tech, and civic news across Lagos Mainland.',
    url: 'https://example.com/mainland-brief',
    enabled: true,
  },
  {
    id: 'island-report',
    name: 'Island Report',
    description: 'Premium district updates and culture stories.',
    url: 'https://example.com/island-report',
    enabled: true,
  },
  {
    id: 'city-sports',
    name: 'City Sports Desk',
    description: 'Local fixtures, stadium news, and talent watch.',
    url: 'https://example.com/city-sports',
    enabled: true,
  },
  {
    id: 'market-pulse',
    name: 'Market Pulse',
    description: 'Daily price checks and trade updates.',
    url: 'https://example.com/market-pulse',
    enabled: true,
  },
  {
    id: 'capital-watch',
    name: 'Capital Watch',
    description: 'National government and policy tracker.',
    url: 'https://example.com/capital-watch',
    enabled: true,
  },
  {
    id: 'naija-energy',
    name: 'Naija Energy',
    description: 'Energy and infrastructure highlights.',
    url: 'https://example.com/naija-energy',
    enabled: true,
  },
  {
    id: 'healthline-ng',
    name: 'Healthline NG',
    description: 'Public health alerts and hospital updates.',
    url: 'https://example.com/healthline-ng',
    enabled: true,
  },
  {
    id: 'campus-wire',
    name: 'Campus Wire',
    description: 'University news and education briefs.',
    url: 'https://example.com/campus-wire',
    enabled: true,
  },
  {
    id: 'coastal-weather',
    name: 'Coastal Weather',
    description: 'Forecasts, flood warnings, and climate notes.',
    url: 'https://example.com/coastal-weather',
    enabled: true,
  },
]

const isBrowser = typeof window !== 'undefined' && !!window.localStorage

function read<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T) {
  if (!isBrowser) return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function getUsers(): User[] {
  return read<User[]>(KEYS.users, [])
}

export function saveUsers(users: User[]) {
  write(KEYS.users, users)
}

export function getCurrentUserId(): string | null {
  return read<string | null>(KEYS.currentUser, null)
}

export function setCurrentUserId(id: string | null) {
  if (!isBrowser) return
  if (id) {
    window.localStorage.setItem(KEYS.currentUser, id)
  } else {
    window.localStorage.removeItem(KEYS.currentUser)
  }
}

export function getApiUpdatesEnabled(): boolean {
  return read<boolean>(KEYS.apiUpdatesEnabled, true)
}

export function setApiUpdatesEnabled(enabled: boolean) {
  write(KEYS.apiUpdatesEnabled, enabled)
}

export function getLikesMap(): Record<string, string[]> {
  return read<Record<string, string[]>>(KEYS.likes, {})
}

export function setLikesMap(map: Record<string, string[]>) {
  write(KEYS.likes, map)
}

export function getBookmarksMap(): Record<string, string[]> {
  return read<Record<string, string[]>>(KEYS.bookmarks, {})
}

export function setBookmarksMap(map: Record<string, string[]>) {
  write(KEYS.bookmarks, map)
}

export function getSources(): Source[] {
  const sources = read<Source[]>(KEYS.sources, [])
  if (!sources.length) {
    write(KEYS.sources, defaultSources)
    return defaultSources
  }
  return sources
}

export function setSources(sources: Source[]) {
  write(KEYS.sources, sources)
}

export function getFollowingMap(): Record<string, string[]> {
  return read<Record<string, string[]>>(KEYS.following, {})
}

export function setFollowingMap(map: Record<string, string[]>) {
  write(KEYS.following, map)
}

export function getNotificationsMap(): Record<string, NotificationItem[]> {
  return read<Record<string, NotificationItem[]>>(KEYS.notifications, {})
}

export function setNotificationsMap(map: Record<string, NotificationItem[]>) {
  write(KEYS.notifications, map)
}

export function getCustomNews(): NewsItem[] {
  return read<NewsItem[]>(KEYS.customNews, [])
}

export function setCustomNews(items: NewsItem[]) {
  write(KEYS.customNews, items)
}

export function getDeletedNewsIds(): string[] {
  return read<string[]>(KEYS.deletedNews, [])
}

export function setDeletedNewsIds(ids: string[]) {
  write(KEYS.deletedNews, ids)
}

export function getNewsCache(): NewsCache | null {
  return read<NewsCache | null>(KEYS.newsCache, null)
}

export function setNewsCache(cache: NewsCache) {
  write(KEYS.newsCache, cache)
}
