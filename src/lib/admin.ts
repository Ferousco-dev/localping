import type { NewsItem, NotificationItem, Source, User } from './types'
import { supabase } from './supabase'

export async function getUserCount() {
  if (!supabase) return 0
  const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
  return count ?? 0
}

export async function getUsers() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, auto_publish')
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    autoPublish: row.auto_publish ?? false,
  })) as Array<Pick<User, 'id' | 'name' | 'email' | 'autoPublish'>>
}

export async function updateUserAutoPublish(userId: string, autoPublish: boolean) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .update({ auto_publish: autoPublish })
    .eq('id', userId)
    .select('id, name, email, auto_publish')
    .single()
  if (error || !data) return null
  return {
    id: data.id as string,
    name: data.name as string,
    email: data.email as string,
    autoPublish: data.auto_publish ?? false,
  } as Pick<User, 'id' | 'name' | 'email' | 'autoPublish'>
}

export async function getPendingNews() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('status', 'pending')
    .eq('news_type', 'community')
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map((row) => ({
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) || 'Community update',
    content: row.content as string,
    image:
      (row.image as string | null) ||
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=640&q=80',
    source: row.source as string,
    location: (row.location as string | null) ?? undefined,
    url: (row.url as string | null) ?? undefined,
    date: (row.published_at as string | null) || (row.created_at as string),
    category: (row.category as string | null) ?? undefined,
    newsType: (row.news_type as NewsItem['newsType']) ?? undefined,
    status: (row.status as NewsItem['status']) ?? undefined,
    verified: (row.verified as boolean | null) ?? undefined,
    authorId: (row.author_id as string | null) ?? undefined,
    authorName: (row.author_name as string | null) ?? undefined,
  })) as NewsItem[]
}

export async function approveNews(id: string, adminId: string) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('news')
    .update({
      status: 'approved',
      verified: true,
      approved_by: adminId,
      approved_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()
  if (error || !data) return null
  await supabase.from('news_cache').upsert(
    {
      id: data.id,
      title: data.title,
      description: data.description,
      content: data.content,
      image: data.image,
      source: data.source,
      url: data.url ?? null,
      location: data.location ?? null,
      published_at: data.published_at ?? data.created_at,
    },
    { onConflict: 'id' },
  )
  return data as NewsItem
}

export async function publishUpdate(
  input: Pick<NewsItem, 'title' | 'description' | 'content' | 'image' | 'source' | 'url' | 'location' | 'category'>,
  adminId?: string,
) {
  if (!supabase) return null
  const payload = {
    title: input.title,
    description: input.description,
    content: input.content,
    image: input.image,
    source: input.source,
    url: input.url ?? null,
    location: input.location ?? 'All',
    category: input.category?.toLowerCase() ?? 'general',
    news_type: 'update',
    status: 'approved',
    verified: true,
    approved_by: adminId ?? null,
    approved_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('news').insert(payload).select('*').single()
  if (error || !data) return null
  await supabase.from('news_cache').upsert(
    {
      id: data.id,
      title: data.title,
      description: data.description,
      content: data.content,
      image: data.image,
      source: data.source,
      url: data.url ?? null,
      location: data.location ?? null,
      published_at: data.published_at ?? data.created_at,
    },
    { onConflict: 'id' },
  )
  return data as NewsItem
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
    category: news.category?.toLowerCase() ?? 'general',
    news_type: news.newsType ?? 'update',
    status: 'approved',
    verified: true,
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
