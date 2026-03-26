import type { Source } from './types'
import { getCache, invalidateCache, setCache } from './cache'
import { supabase } from './supabase'

const defaultSources: Omit<Source, 'id' | 'enabled'>[] = [
  {
    name: 'Lagos Daily',
    description: 'Metro updates, transport, and local policy coverage.',
    url: 'https://example.com/lagos-daily',
  },
  {
    name: 'Mainland Brief',
    description: 'Business, tech, and civic news across Lagos Mainland.',
    url: 'https://example.com/mainland-brief',
  },
  {
    name: 'Island Report',
    description: 'Premium district updates and culture stories.',
    url: 'https://example.com/island-report',
  },
  {
    name: 'City Sports Desk',
    description: 'Local fixtures, stadium news, and talent watch.',
    url: 'https://example.com/city-sports',
  },
  {
    name: 'Market Pulse',
    description: 'Daily price checks and trade updates.',
    url: 'https://example.com/market-pulse',
  },
  {
    name: 'Capital Watch',
    description: 'National government and policy tracker.',
    url: 'https://example.com/capital-watch',
  },
  {
    name: 'Naija Energy',
    description: 'Energy and infrastructure highlights.',
    url: 'https://example.com/naija-energy',
  },
  {
    name: 'Healthline NG',
    description: 'Public health alerts and hospital updates.',
    url: 'https://example.com/healthline-ng',
  },
  {
    name: 'Campus Wire',
    description: 'University news and education briefs.',
    url: 'https://example.com/campus-wire',
  },
  {
    name: 'Coastal Weather',
    description: 'Forecasts, flood warnings, and climate notes.',
    url: 'https://example.com/coastal-weather',
  },
]

export async function getSources(): Promise<Source[]> {
  if (!supabase) return []
  const cacheKey = 'sources:all'
  const cached = getCache<Source[]>(cacheKey)
  if (cached) return cached
  const { data, error } = await supabase.from('sources').select('*').order('created_at', { ascending: false })
  if (error) return []
  if (!data || data.length === 0) {
    await supabase.from('sources').insert(
      defaultSources.map((source) => ({
        ...source,
        enabled: true,
      })),
    )
    const { data: seeded } = await supabase
      .from('sources')
      .select('*')
      .order('created_at', { ascending: false })
    const items = (seeded || []) as Source[]
    setCache(cacheKey, items)
    return items
  }
  const items = data as Source[]
  setCache(cacheKey, items)
  return items
}

export async function getFollowedSourceIds(userId: string): Promise<string[]> {
  if (!supabase) return []
  const cacheKey = `follows:${userId}`
  const cached = getCache<string[]>(cacheKey)
  if (cached) return cached
  const { data } = await supabase.from('follows').select('source_id').eq('user_id', userId)
  const items = (data || []).map((row) => row.source_id)
  setCache(cacheKey, items)
  return items
}

export async function toggleFollow(userId: string, sourceId: string) {
  if (!supabase) return false
  const { data } = await supabase
    .from('follows')
    .select('id')
    .eq('user_id', userId)
    .eq('source_id', sourceId)
    .maybeSingle()

  if (data?.id) {
    await supabase.from('follows').delete().eq('id', data.id)
    invalidateCache(`follows:${userId}`)
    return false
  }

  await supabase.from('follows').insert({ user_id: userId, source_id: sourceId })
  invalidateCache(`follows:${userId}`)
  return true
}
