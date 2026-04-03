import { useEffect, useMemo, useState } from 'react'
import NotificationItem from '../components/NotificationItem'
import { Link } from 'react-router-dom'
import { Bell, Megaphone } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getNotifications } from '../lib/notifications'
import type { NotificationItem as Notification } from '../lib/types'

type NotificationFilter = 'all' | 'admin' | 'sources'

export default function Notifications() {
  const { user } = useAuth()
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<NotificationFilter>('all')

  useEffect(() => {
    let active = true
    if (!user) return
    getNotifications(user.id)
      .then((data) => {
        if (active) setItems(data)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user])

  const stats = useMemo(() => {
    const total = items.length
    const admin = items.filter((i) => i.type === 'admin').length
    const sources = total - admin
    return { total, admin, sources }
  }, [items])

  const filtered = useMemo(() => {
    if (filter === 'admin') return items.filter((i) => i.type === 'admin')
    if (filter === 'sources') return items.filter((i) => i.type !== 'admin')
    return items
  }, [filter, items])

  if (!user) {
    return (
      <section className="lp-page">
        <div className="lp-state">Log in to view notifications.</div>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="lp-page">
        <div className="lp-stack">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="lp-notification-skeleton">
              <div className="lp-skeleton-icon"></div>
              <div className="lp-skeleton-content">
                <span className="lp-skeleton-line lg"></span>
                <span className="lp-skeleton-line sm"></span>
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="lp-page">
      <div className="lp-hero">
        <div className="lp-hero-main">
          <div className="lp-hero-icon">
            <Bell size={18} aria-hidden="true" />
          </div>
          <div className="lp-hero-copy">
            <h2>Notifications</h2>
            <p>Broadcasts and source updates — all in one inbox.</p>
          </div>
        </div>
        <div className="lp-hero-actions">
          <Link to="/activities" className="lp-button secondary">
            Activities
          </Link>
        </div>
        <div className="lp-hero-stats">
          <div>
            <span>Total</span>
            <strong>{stats.total}</strong>
          </div>
          <div>
            <span>Admin</span>
            <strong>{stats.admin}</strong>
          </div>
          <div>
            <span>Sources</span>
            <strong>{stats.sources}</strong>
          </div>
        </div>
      </div>

      <div className="lp-segmented" role="tablist" aria-label="Notification filters">
        <button
          type="button"
          role="tab"
          aria-selected={filter === 'all'}
          className={filter === 'all' ? 'lp-segment active' : 'lp-segment'}
          onClick={() => setFilter('all')}
        >
          <Bell size={16} aria-hidden="true" />
          <span>All</span>
          <span className="lp-segment-count">{stats.total}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === 'admin'}
          className={filter === 'admin' ? 'lp-segment active' : 'lp-segment'}
          onClick={() => setFilter('admin')}
        >
          <Megaphone size={16} aria-hidden="true" />
          <span>Admin</span>
          <span className="lp-segment-count">{stats.admin}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === 'sources'}
          className={filter === 'sources' ? 'lp-segment active' : 'lp-segment'}
          onClick={() => setFilter('sources')}
        >
          <Bell size={16} aria-hidden="true" />
          <span>Sources</span>
          <span className="lp-segment-count">{stats.sources}</span>
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="lp-empty-card">
          <strong>No notifications yet.</strong>
          <p>When sources post updates or admins broadcast alerts, you’ll see them here.</p>
        </div>
      ) : (
        <div className="lp-stack">
          {filtered.map((item) => (
            <NotificationItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  )
}
