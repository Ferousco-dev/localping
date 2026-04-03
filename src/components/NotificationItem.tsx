import { Bell, Megaphone } from 'lucide-react'
import type { NotificationItem as Notification } from '../lib/types'

export default function NotificationItem({ item }: { item: Notification }) {
  const Icon = item.type === 'admin' ? Megaphone : Bell
  return (
    <div className="lp-notification-item">
      <div className="lp-notification-icon" aria-hidden="true">
        <Icon size={18} />
      </div>
      <div className="lp-notification-body">
        <div className="lp-notification-meta">
          <span className="lp-notification-type">{item.type === 'admin' ? 'Admin' : 'Source'}</span>
          <span className="lp-notification-time">{new Date(item.timestamp).toLocaleString()}</span>
        </div>
        <p className="lp-notification-message">{item.message}</p>
      </div>
    </div>
  )
}
