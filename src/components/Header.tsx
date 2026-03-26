import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Header() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const formRef = useRef<HTMLFormElement | null>(null)

  useEffect(() => {
    if (!location.pathname.startsWith('/search')) return
    const params = new URLSearchParams(location.search)
    setQuery(params.get('q') || '')
  }, [location.pathname, location.search])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node
      if (!formRef.current) return
      if (!formRef.current.contains(target) && !query.trim()) {
        setExpanded(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [query])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!query.trim()) return
    navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header className="lp-header">
      <Link to="/" className="lp-brand">
        <span className="lp-brand-primary">Local</span>
        <span className="lp-brand-accent">Ping</span>
      </Link>
      <form
        ref={formRef}
        className={expanded ? 'lp-search expanded' : 'lp-search'}
        onSubmit={handleSubmit}
        onFocus={() => setExpanded(true)}
      >
        <button type="button" className="lp-search-icon" onClick={() => setExpanded(true)}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7"></circle>
            <line x1="16.65" y1="16.65" x2="21" y2="21"></line>
          </svg>
        </button>
        <input
          type="search"
          placeholder="Search news"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button type="submit" className="lp-search-submit">
          Go
        </button>
      </form>
      {isAdmin && (
        <Link to="/admin" className="lp-admin-button">
          Admin
        </Link>
      )}
    </header>
  )
}
