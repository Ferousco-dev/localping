import mockNews from '../data/mock-news.json'
import type { NewsItem } from './types'
import { getCache, invalidateCache, setCache } from './cache'
import { isSupabaseConfigured, supabase } from './supabase'

const GNEWS_API_KEY = import.meta.env.VITE_GNEWS_API_KEY as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SHARED_CACHE_TTL = 1000 * 60 * 30

function normalizeLocation(location: string) {
  const clean = location.trim()
  return clean.length ? clean : 'Lagos, Nigeria'
}

function mapNews(row: {
  id: string
  title: string
  description: string
  content: string
  image: string | null
  source: string
  location: string | null
  url: string | null
  published_at: string | null
  created_at: string
}): NewsItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    content: row.content,
    image:
      row.image ||
      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=640&q=80',
    source: row.source,
    location: row.location ?? undefined,
    url: row.url ?? undefined,
    date: row.published_at || row.created_at,
  }
}

function getMockNews(location: string): NewsItem[] {
  return (mockNews as NewsItem[]).map((item) => ({
    ...item,
    location,
  }))
}

async function fetchGNews(location: string): Promise<NewsItem[]> {
  if (!GNEWS_API_KEY) return []
  const query = encodeURIComponent(location)
  const searchUrl = `https://gnews.io/api/v4/search?q=${query}&lang=en&max=10&token=${GNEWS_API_KEY}`
  const response = await fetch(searchUrl)
  if (!response.ok) {
    const fallbackUrl = `https://gnews.io/api/v4/top-headlines?country=ng&lang=en&max=10&token=${GNEWS_API_KEY}`
    const fallbackResponse = await fetch(fallbackUrl)
    if (!fallbackResponse.ok) return []
    const fallbackData = (await fallbackResponse.json()) as {
      articles: Array<{
        title: string
        description: string
        content: string
        image?: string
        source: { name: string }
        publishedAt: string
        url: string
      }>
    }
    return fallbackData.articles.map((article) => ({
      id: `gnews-${article.url}`,
      title: article.title,
      description: article.description || 'Local update',
      content: article.content || article.description || 'Full story available at source.',
      image:
        article.image ||
        'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=640&q=80',
      source: article.source?.name || 'GNews',
      date: article.publishedAt,
      url: article.url,
      location,
    }))
  }
  const data = (await response.json()) as {
    articles: Array<{
      title: string
      description: string
      content: string
      image?: string
      source: { name: string }
      publishedAt: string
      url: string
    }>
  }
  return data.articles.map((article) => ({
    id: `gnews-${article.url}`,
    title: article.title,
    description: article.description || 'Local update',
    content: article.content || article.description || 'Full story available at source.',
    image:
      article.image ||
      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=640&q=80',
    source: article.source?.name || 'GNews',
    date: article.publishedAt,
    url: article.url,
    location,
  }))
}

async function fetchPunchNews(): Promise<NewsItem[]> {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return []
    const response = await fetch(`${SUPABASE_URL}/functions/v1/punch-proxy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
    })
    if (!response.ok) return []
    const xmlText = await response.text()
    if (!xmlText) return []
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlText, 'text/xml')
    const items = Array.from(doc.querySelectorAll('item'))
    return items.slice(0, 10).map((item) => {
      const title = item.querySelector('title')?.textContent?.trim() || 'Punch News'
      const link = item.querySelector('link')?.textContent?.trim() || ''
      const description = item.querySelector('description')?.textContent?.trim() || 'Punch update'
      const pubDate = item.querySelector('pubDate')?.textContent?.trim() || new Date().toISOString()
      const mediaContent = item.querySelector('media\\:content')
      const image = mediaContent?.getAttribute('url') || ''
      return {
        id: `punch-${link || title}`,
        title,
        description,
        content: description,
        image:
          image ||
          'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=640&q=80',
        source: 'Punch News',
        date: pubDate,
        url: link || undefined,
        location: 'Nigeria',
      }
    })
  } catch {
    return []
  }
}

function mergeFeed(items: NewsItem[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = `${item.title}-${item.source}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function persistNewsCache(items: NewsItem[]) {
  if (!supabase || items.length === 0) return
  const payload = items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    content: item.content,
    image: item.image,
    source: item.source,
    url: item.url ?? null,
    location: item.location ?? null,
    published_at: item.date,
  }))
  await supabase.from('news_cache').upsert(payload, { onConflict: 'id' })
}

async function getNewsCacheByIds(ids: string[]): Promise<NewsItem[]> {
  if (!supabase || ids.length === 0) return []
  const { data, error } = await supabase.from('news_cache').select('*').in('id', ids)
  if (error || !data) return []
  const mapped = data.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description || 'Local update',
    content: row.content || row.description || 'Full story available at source.',
    image:
      row.image ||
      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=640&q=80',
    source: row.source || 'Local Wire',
    url: row.url || undefined,
    location: row.location || undefined,
    date: row.published_at || row.created_at,
  })) as NewsItem[]
  const lookup = new Map(mapped.map((item) => [item.id, item]))
  return ids.map((id) => lookup.get(id)).filter(Boolean) as NewsItem[]
}

function cacheLatest(items: NewsItem[]) {
  if (!items.length) return
  setCache('news:latest', items)
}

function shuffle<T>(items: T[]) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

async function getSharedNewsPool(): Promise<NewsItem[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('news_cache')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(50)
  if (error || !data) return []
  const items = data.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description || 'Local update',
    content: row.content || row.description || 'Full story available at source.',
    image:
      row.image ||
      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=640&q=80',
    source: row.source || 'Local Wire',
    url: row.url || undefined,
    location: row.location || undefined,
    date: row.published_at || row.created_at,
  })) as NewsItem[]
  return shuffle(items)
}

async function shouldRefreshSharedPool(): Promise<boolean> {
  if (!supabase) return true
  const { data, error } = await supabase
    .from('news_cache')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !data?.created_at) return true
  const last = new Date(data.created_at).getTime()
  return Date.now() - last > SHARED_CACHE_TTL
}

export async function getNewsByLocation(location: string): Promise<NewsItem[]> {
  const requestedLocation = normalizeLocation(location)
  const cacheKey = `news:shared`
  const cached = getCache<NewsItem[]>(cacheKey)
  if (cached) return cached

  if (supabase) {
    const sharedItems = await getSharedNewsPool()
    if (sharedItems.length) {
      setCache(cacheKey, sharedItems)
      cacheLatest(sharedItems)
      const refresh = await shouldRefreshSharedPool()
      if (refresh) {
        const [gnewsItems, punchItems] = await Promise.all([fetchGNews(requestedLocation), fetchPunchNews()])
        const apiItems = mergeFeed([...gnewsItems, ...punchItems])
        if (apiItems.length) await persistNewsCache(apiItems)
      }
      return sharedItems
    }
  }

  const [gnewsItems, punchItems] = await Promise.all([fetchGNews(requestedLocation), fetchPunchNews()])
  const apiItems = mergeFeed([...gnewsItems, ...punchItems])
  if (apiItems.length) {
    setCache(cacheKey, apiItems)
    cacheLatest(apiItems)
    await persistNewsCache(apiItems)
    return apiItems
  }

  if (!isSupabaseConfigured || !supabase) {
    const items = getMockNews(requestedLocation)
    if (items.length) setCache(cacheKey, items)
    cacheLatest(items)
    return items
  }

  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(30)

  if (error || !data) {
    const items = getMockNews(requestedLocation)
    if (items.length) setCache(cacheKey, items)
    cacheLatest(items)
    await persistNewsCache(items)
    return items
  }

  if (data.length === 0) {
    const items = getMockNews(requestedLocation)
    if (items.length) setCache(cacheKey, items)
    cacheLatest(items)
    await persistNewsCache(items)
    return items
  }

  const items = data.map(mapNews)
  if (items.length) setCache(cacheKey, items)
  cacheLatest(items)
  await persistNewsCache(items)
  return items
}

export async function getNewsById(id: string): Promise<NewsItem | null> {
  const latest = getCache<NewsItem[]>('news:latest')
  if (latest) {
    const found = latest.find((item) => item.id === id)
    if (found) return found
  }
  if (supabase) {
    const cached = await getNewsCacheByIds([id])
    if (cached.length) return cached[0]
  }
  if (!isSupabaseConfigured || !supabase) {
    const found = (mockNews as NewsItem[]).find((item) => item.id === id)
    return found ?? null
  }
  const { data, error } = await supabase.from('news').select('*').eq('id', id).single()
  if (error || !data) return null
  const item = mapNews(data)
  await persistNewsCache([item])
  return item
}

export async function toggleLike(userId: string, newsId: string) {
  if (!supabase) return false
  const { data } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', userId)
    .eq('news_id', newsId)
    .maybeSingle()

  if (data?.id) {
    await supabase.from('likes').delete().eq('id', data.id)
    invalidateCache(`likes:${userId}`)
    return false
  }

  await supabase.from('likes').insert({ user_id: userId, news_id: newsId })
  invalidateCache(`likes:${userId}`)
  return true
}

export async function toggleBookmark(userId: string, newsId: string) {
  if (!supabase) return false
  const { data } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('news_id', newsId)
    .maybeSingle()

  if (data?.id) {
    await supabase.from('bookmarks').delete().eq('id', data.id)
    invalidateCache(`bookmarks:${userId}`)
    return false
  }

  await supabase.from('bookmarks').insert({ user_id: userId, news_id: newsId })
  invalidateCache(`bookmarks:${userId}`)
  return true
}

export async function getLikeStatus(userId: string, newsId: string) {
  if (!supabase) return false
  const { data } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', userId)
    .eq('news_id', newsId)
    .maybeSingle()
  return !!data?.id
}

export async function getBookmarkStatus(userId: string, newsId: string) {
  if (!supabase) return false
  const { data } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('news_id', newsId)
    .maybeSingle()
  return !!data?.id
}

export async function getLikedNews(userId: string): Promise<NewsItem[]> {
  if (!supabase) return []
  const cacheKey = `likes:${userId}`
  const cached = getCache<NewsItem[]>(cacheKey)
  if (cached) return cached
  const { data, error } = await supabase
    .from('likes')
    .select('news_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  const ids = data.map((row) => row.news_id)
  const items = await getNewsCacheByIds(ids)
  setCache(cacheKey, items)
  cacheLatest(items)
  return items
}

export async function getBookmarkedNews(userId: string): Promise<NewsItem[]> {
  if (!supabase) return []
  const cacheKey = `bookmarks:${userId}`
  const cached = getCache<NewsItem[]>(cacheKey)
  if (cached) return cached
  const { data, error } = await supabase
    .from('bookmarks')
    .select('news_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  const ids = data.map((row) => row.news_id)
  const items = await getNewsCacheByIds(ids)
  setCache(cacheKey, items)
  cacheLatest(items)
  return items
}

export async function shareNews(url: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(url)
    return true
  }
  window.prompt('Copy this link', url)
  return false
}

export async function searchNews(query: string): Promise<NewsItem[]> {
  const term = query.trim()
  if (!term) return []
  const cacheKey = `search:${term.toLowerCase()}`
  const cached = getCache<NewsItem[]>(cacheKey)
  if (cached) return cached
  if (!isSupabaseConfigured || !supabase) {
    const items = (mockNews as NewsItem[]).filter(
      (item) =>
        item.title.toLowerCase().includes(term.toLowerCase()) ||
        item.description.toLowerCase().includes(term.toLowerCase()),
    )
    setCache(cacheKey, items)
    cacheLatest(items)
    return items
  }
  const { data, error } = await supabase
    .from('news_cache')
    .select('*')
    .or(`title.ilike.%${term}%,description.ilike.%${term}%`)
    .order('published_at', { ascending: false })
    .limit(50)
  if (error || !data) return []
  const items = data.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description || 'Local update',
    content: row.content || row.description || 'Full story available at source.',
    image:
      row.image ||
      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=640&q=80',
    source: row.source || 'Local Wire',
    url: row.url || undefined,
    location: row.location || undefined,
    date: row.published_at || row.created_at,
  })) as NewsItem[]
  setCache(cacheKey, items)
  cacheLatest(items)
  return items
}
