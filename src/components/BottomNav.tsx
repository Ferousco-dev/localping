import { Home, Newspaper, Plus, Users, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { getApiUpdatesEnabled } from '../lib/storage'

export default function BottomNav() {
  const [apiUpdatesEnabled, setApiUpdatesEnabled] = useState(getApiUpdatesEnabled())

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'localping_api_updates_enabled') {
        setApiUpdatesEnabled(getApiUpdatesEnabled())
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const leftLinks = [
    { to: '/', label: 'Home', icon: Home },
    ...(apiUpdatesEnabled ? [{ to: '/updates', label: 'Updates', icon: Newspaper }] : []),
  ]
  const rightLinks = [
    { to: '/community', label: 'Community', icon: Users },
    { to: '/profile', label: 'Profile', icon: User },
  ]

  return (
    <nav className="lp-bottom-nav">
      {leftLinks.map((link) => {
        const Icon = link.icon
        return (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) => (isActive ? 'lp-nav-link active' : 'lp-nav-link')}
          >
            <Icon size={18} />
            <span>{link.label}</span>
          </NavLink>
        )
      })}
      <NavLink to="/post" className="lp-nav-post" aria-label="New post">
        <Plus size={22} />
      </NavLink>
      {rightLinks.map((link) => {
        const Icon = link.icon
        return (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => (isActive ? 'lp-nav-link active' : 'lp-nav-link')}
          >
            <Icon size={18} />
            <span>{link.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
