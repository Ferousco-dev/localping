import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Bookmark, Flag, Heart, Newspaper, Timer } from 'lucide-react'
import NewsCard from '../components/NewsCard'
import { useAuth } from '../context/AuthContext'
import {
  getBookmarkedNews,
  getFlaggedNews,
  getLikedNews,
  getPendingNewsByUser,
  getUserPosts,
} from '../lib/news'
import type { NewsItem } from '../lib/types'

type ActivitiesTab = 'liked' | 'bookmarked' | 'posts' | 'pending' | 'flagged'

export default function Activities() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<ActivitiesTab>('liked')
  const [items, setItems] = useState<NewsItem[]>([])
  const [pending, setPending] = useState<Array<{ id: string; title: string; date: string }>>([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [counts, setCounts] = useState({
    liked: 0,
    bookmarked: 0,
    posts: 0,
    pending: 0,
    flagged: 0,
  })

  const tabs = useMemo(
    () =>
      [
        { key: 'liked', label: 'Liked', icon: Heart },
        { key: 'bookmarked', label: 'Saved', icon: Bookmark },
        { key: 'posts', label: 'Posts', icon: Newspaper },
        { key: 'pending', label: 'Pending', icon: Timer },
        { key: 'flagged', label: 'Flagged', icon: Flag },
      ] as const,
    [],
  )

  useEffect(() => {
    if (!user) return
    let active = true
    Promise.all([
      getLikedNews(user.id),
      getBookmarkedNews(user.id),
      getUserPosts(user.id),
      getPendingNewsByUser(user.id),
      getFlaggedNews(user.id),
    ])
      .then(([liked, bookmarked, posts, pendingPosts, flagged]) => {
        if (!active) return
        setCounts({
          liked: liked.length,
          bookmarked: bookmarked.length,
          posts: posts.length,
          pending: pendingPosts.length,
          flagged: flagged.length,
        })
      })
      .catch(() => {
        // Non-blocking: counts will still update when each tab is opened.
      })
    return () => {
      active = false
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    let active = true
    setBusy(true)
    setError('')

    const load = async () => {
      try {
        if (activeTab === 'liked') {
          const data = await getLikedNews(user.id)
          if (active) setItems(data)
          if (active) setCounts((prev) => ({ ...prev, liked: data.length }))
          return
        }
        if (activeTab === 'bookmarked') {
          const data = await getBookmarkedNews(user.id)
          if (active) setItems(data)
          if (active) setCounts((prev) => ({ ...prev, bookmarked: data.length }))
          return
        }
        if (activeTab === 'posts') {
          const data = await getUserPosts(user.id)
          if (active) setItems(data)
          if (active) setCounts((prev) => ({ ...prev, posts: data.length }))
          return
        }
        if (activeTab === 'flagged') {
          const data = await getFlaggedNews(user.id)
          if (active) setItems(data)
          if (active) setCounts((prev) => ({ ...prev, flagged: data.length }))
          return
        }
        const data = await getPendingNewsByUser(user.id)
        if (active) {
          setPending(
            data.map((post) => ({
              id: post.id,
              title: post.title,
              date: post.date,
            })),
          )
          setCounts((prev) => ({ ...prev, pending: data.length }))
        }
      } catch {
        if (active) setError('Unable to load your activities right now.')
      } finally {
        if (active) setBusy(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [activeTab, user])

  if (loading) {
    return (
      <section className="lp-page">
        <div className="lp-state">Loading...</div>
      </section>
    )
  }

  if (!user) {
    return (
      <section className="lp-page">
        <div className="lp-state">You need to be signed in to view activities.</div>
      </section>
    )
  }

  const showPending = activeTab === 'pending'

  return (
    <section className="lp-page">
      <div className="lp-hero">
        <div className="lp-hero-main">
          <div className="lp-hero-icon">
            <Bell size={18} aria-hidden="true" />
          </div>
          <div className="lp-hero-copy">
            <h2>Activities</h2>
            <p>Your likes, saves, posts, and everything in between.</p>
          </div>
        </div>
        <div className="lp-hero-actions">
          <Link to="/notifications" className="lp-button secondary">
            Notifications
          </Link>
        </div>
        <div className="lp-hero-stats">
          <div>
            <span>Liked</span>
            <strong>{counts.liked}</strong>
          </div>
          <div>
            <span>Saved</span>
            <strong>{counts.bookmarked}</strong>
          </div>
          <div>
            <span>Posts</span>
            <strong>{counts.posts}</strong>
          </div>
          <div>
            <span>Pending</span>
            <strong>{counts.pending}</strong>
          </div>
        </div>
      </div>

      <div className="lp-segmented" role="tablist" aria-label="Activities sections">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const count =
            tab.key === 'liked'
              ? counts.liked
              : tab.key === 'bookmarked'
                ? counts.bookmarked
                : tab.key === 'posts'
                  ? counts.posts
                  : tab.key === 'pending'
                    ? counts.pending
                    : counts.flagged
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              className={isActive ? 'lp-segment active' : 'lp-segment'}
              onClick={() => setActiveTab(tab.key)}
              type="button"
              role="tab"
              aria-selected={isActive}
            >
              <Icon size={16} aria-hidden="true" />
              <span>{tab.label}</span>
              <span className="lp-segment-count">{count}</span>
            </button>
          )
        })}
      </div>

      {busy ? (
        <div className="lp-panel">
          <div className="lp-state">Loading activity…</div>
        </div>
      ) : error ? (
        <div className="lp-panel">
          <div className="lp-state">{error}</div>
        </div>
      ) : showPending ? (
        <div className="lp-panel">
          <div>
            <h3>Pending</h3>
            <p>Posts you submitted that are still awaiting approval.</p>
          </div>
          <div className="lp-stack">
            {pending.length === 0 ? (
              <div className="lp-empty-card">
                <strong>Nothing pending.</strong>
                <p>When you submit posts for approval, they’ll show up here.</p>
              </div>
            ) : (
              pending.map((post) => (
                <div key={post.id} className="lp-activity-row">
                  <div>
                    <strong>{post.title}</strong>
                    <p>Submitted {new Date(post.date).toLocaleDateString()}</p>
                  </div>
                  <span className="lp-pill muted">Awaiting review</span>
                </div>
              ))
            )}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="lp-empty-card">
          <strong>No activity yet.</strong>
          <p>Try liking or saving a post — it will appear here instantly.</p>
        </div>
      ) : (
        <div className="lp-news-grid">
          {items.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  )
}

