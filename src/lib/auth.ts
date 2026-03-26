import type { User } from './types'
import { isSupabaseConfigured, supabase } from './supabase'

export const ADMIN_KEY = 'LOCALPING-ADMIN'

async function fetchProfile(userId: string): Promise<User | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, location, admin_key')
    .eq('id', userId)
    .single()
  if (error || !data) return null
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    location: data.location,
    adminKey: data.admin_key ?? undefined,
  }
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
  })
  if (error || !data.user) {
    return { user: null, error: error?.message || 'Unable to create account.' }
  }

  const profile = {
    id: data.user.id,
    name: input.name.trim(),
    email: input.email.trim(),
    location: input.location.trim(),
    admin_key: input.adminKey?.trim() || null,
  }

  const { error: profileError } = await supabase.from('profiles').insert(profile)
  if (profileError) {
    return { user: null, error: profileError.message }
  }

  return {
    user: {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      location: profile.location,
      adminKey: profile.admin_key ?? undefined,
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

  const profile = await fetchProfile(data.user.id)
  if (!profile) {
    return { user: null, error: 'Profile not found.' }
  }

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
  return fetchProfile(data.user.id)
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
