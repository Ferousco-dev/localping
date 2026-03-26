import { useEffect, useState } from 'react'
import NotificationItem from '../components/NotificationItem'
import { useAuth } from '../context/AuthContext'
import { getNotifications } from '../lib/notifications'
import type { NotificationItem as Notification } from '../lib/types'

export default function Notifications() {
  const { user } = useAuth()
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

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
      <div className="lp-page-header">
        <div>
          <h2>Notifications</h2>
          <p>Updates from followed sources and admin broadcasts.</p>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="lp-state">No notifications yet.</div>
      ) : (
        <div className="lp-stack">
          {items.map((item) => (
            <NotificationItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  )
}
