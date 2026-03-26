import type { NewsItem, NotificationItem, Source, User } from './types'
import { supabase } from './supabase'

export async function getUserCount() {
  if (!supabase) return 0
  const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
  return count ?? 0
}

export async function addSource(input: Omit<Source, 'id' | 'enabled'>) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('sources')
    .insert({
      name: input.name.trim(),
      description: input.description.trim(),
      url: input.url.trim(),
      enabled: true,
    })
    .select('*')
    .single()
  if (error || !data) return null
  return data as Source
}

export async function deleteSource(id: string) {
  if (!supabase) return
  await supabase.from('sources').delete().eq('id', id)
}

export async function deleteNews(id: string) {
  if (!supabase) return
  await supabase.from('news').delete().eq('id', id)
}

export async function addNews(news: Omit<NewsItem, 'id' | 'date'> & { date?: string }) {
  if (!supabase) return null
  const payload = {
    title: news.title,
    description: news.description,
    content: news.content,
    image: news.image,
    source: news.source,
    url: news.url ?? null,
    location: news.location ?? 'All',
    published_at: news.date || new Date().toISOString(),
  }
  const { data, error } = await supabase.from('news').insert(payload).select('*').single()
  if (error || !data) return null
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    content: data.content,
    image: data.image,
    source: data.source,
    url: data.url ?? undefined,
    location: data.location ?? undefined,
    date: data.published_at || data.created_at,
  } as NewsItem
}

export async function broadcast(message: string, users?: User[]) {
  if (!supabase) return null
  const list = users
  let targetUsers = list
  if (!targetUsers) {
    const { data } = await supabase.from('profiles').select('id')
    targetUsers = (data || []) as User[]
  }
  const notification = {
    message: message.trim(),
    type: 'admin',
  }
  const payload = (targetUsers || []).map((user) => ({
    user_id: user.id,
    ...notification,
  }))
  if (!payload.length) return null
  const { data } = await supabase.from('notifications').insert(payload).select('*')
  return data?.[0] as NotificationItem | null
}
