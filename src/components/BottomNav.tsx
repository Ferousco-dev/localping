import { Home, Newspaper, Users, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/updates', label: 'Updates', icon: Newspaper },
  { to: '/community', label: 'Community', icon: Users },
  { to: '/profile', label: 'Profile', icon: User },
]

export default function BottomNav() {
  return (
    <nav className="lp-bottom-nav">
      {links.map((link) => {
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
    </nav>
  )
}
