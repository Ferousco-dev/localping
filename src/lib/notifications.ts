import type { NotificationItem } from './types'
import { getCache, setCache } from './cache'
import { supabase } from './supabase'

export async function getNotifications(userId: string): Promise<NotificationItem[]> {
  if (!supabase) return []
  const cacheKey = `notifications:${userId}`
  const cached = getCache<NotificationItem[]>(cacheKey)
  if (cached) return cached
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  const items = data.map((item) => ({
    id: item.id,
    message: item.message,
    timestamp: item.created_at,
    type: item.type === 'admin' ? 'admin' : 'source',
  })) as NotificationItem[]
  setCache(cacheKey, items)
  return items
}
