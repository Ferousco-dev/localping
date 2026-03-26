import { Bell, Megaphone } from 'lucide-react'
import type { NotificationItem as Notification } from '../lib/types'

export default function NotificationItem({ item }: { item: Notification }) {
  const Icon = item.type === 'admin' ? Megaphone : Bell
  return (
    <div className="lp-notification-item">
      <div className="lp-notification-icon">
        <Icon size={18} />
      </div>
      <div>
        <p>{item.message}</p>
        <span>{new Date(item.timestamp).toLocaleString()}</span>
      </div>
    </div>
  )
}
