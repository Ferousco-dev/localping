import type { User } from './types'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './supabase'

export const ADMIN_KEY = 'LOCALPING-ADMIN'

async function fetchProfile(userId: string): Promise<User | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, location, admin_key, auto_publish')
    .eq('id', userId)
    .single()
  if (error || !data) return null
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    location: data.location,
    adminKey: data.admin_key ?? undefined,
    autoPublish: data.auto_publish ?? undefined,
  }
}

function buildProfilePayload(authUser: SupabaseUser, fallback?: { name?: string; location?: string; adminKey?: string }) {
  const meta = authUser.user_metadata || {}
  return {
    id: authUser.id,
    name: (meta.name as string) || fallback?.name || 'LocalPing User',
    email: authUser.email || '',
    location: (meta.location as string) || fallback?.location || 'Lagos, Nigeria',
    admin_key: (meta.admin_key as string) || fallback?.adminKey || null,
    auto_publish: false,
  }
}

async function ensureProfile(authUser: SupabaseUser, fallback?: { name?: string; location?: string; adminKey?: string }) {
  const existing = await fetchProfile(authUser.id)
  if (existing) return existing
  if (!supabase) return null
  const payload = buildProfilePayload(authUser, fallback)
  const { error } = await supabase.from('profiles').insert(payload)
  if (error) return null
  return fetchProfile(authUser.id)
}

export async function signUp(input: {
  name: string
  email: string
  password: string
  location: string
  adminKey?: string
}): Promise<{ user: User | null; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { user: null, error: 'Supabase is not configured.' }
  }
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        name: input.name.trim(),
        location: input.location.trim(),
        admin_key: input.adminKey?.trim() || null,
      },
    },
  })
  if (error || !data.user) {
    return { user: null, error: error?.message || 'Unable to create account.' }
  }

  if (data.session) {
    const profile = await ensureProfile(data.user, {
      name: input.name.trim(),
      location: input.location.trim(),
      adminKey: input.adminKey?.trim(),
    })
    if (profile) return { user: profile }
  }

  return {
    user: {
      id: data.user.id,
      name: input.name.trim(),
      email: input.email.trim(),
      location: input.location.trim(),
      adminKey: input.adminKey?.trim() || undefined,
      autoPublish: false,
    },
  }
}

export async function login(input: {
  email: string
  password: string
}): Promise<{ user: User | null; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { user: null, error: 'Supabase is not configured.' }
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  })
  if (error || !data.user) {
    return { user: null, error: error?.message || 'Invalid email or password.' }
  }

  let profile = await fetchProfile(data.user.id)
  if (!profile) {
    profile = await ensureProfile(data.user)
  }
  if (!profile) return { user: null, error: 'Profile not found.' }

  return { user: profile }
}

export async function logout() {
  if (!supabase) return
  await supabase.auth.signOut()
}

export async function getCurrentUser(): Promise<User | null> {
  if (!supabase) return null
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  const profile = await fetchProfile(data.user.id)
  if (profile) return profile
  return ensureProfile(data.user)
}

export async function updateUser(nextUser: User) {
  if (!supabase) return
  await supabase
    .from('profiles')
    .update({ name: nextUser.name, location: nextUser.location })
    .eq('id', nextUser.id)
}

export function isAdmin(user: User | null): boolean {
  if (!user) return false
  return user.adminKey === ADMIN_KEY
}
