import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import NewsCard from '../components/NewsCard'
import { useAuth } from '../context/AuthContext'
import { getBookmarkedNews } from '../lib/news'
import type { NewsItem } from '../lib/types'

export default function Bookmarks() {
  const { user } = useAuth()
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    if (!user) return
    getBookmarkedNews(user.id)
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
        <div className="lp-state">Log in to view bookmarked stories.</div>
      </section>
    )
  }

  return (
    <section className="lp-page">
      <div className="lp-library-hero">
        <div>
          <h2>Bookmarks</h2>
          <p>Your saved headlines, ready to revisit.</p>
        </div>
        <span className="lp-search-count">{items.length} items</span>
      </div>
      {loading ? (
        <div className="lp-state">Loading bookmarks...</div>
      ) : items.length === 0 ? (
        <div className="lp-library-empty">
          <div>
            <h3>No bookmarks yet</h3>
            <p>Save a headline to keep it on your shortlist.</p>
          </div>
          <Link to="/" className="lp-button secondary">
            Explore news
          </Link>
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
