export type User = {
  id: string
  name: string
  email: string
  location: string
  adminKey?: string
}

export type Source = {
  id: string
  name: string
  description: string
  url: string
  enabled: boolean
}

export type NewsItem = {
  id: string
  title: string
  description: string
  content: string
  image: string
  source: string
  date: string
  url?: string
  location?: string
}

export type NotificationItem = {
  id: string
  message: string
  timestamp: string
  type: 'source' | 'admin'
}
