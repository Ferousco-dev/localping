import { useEffect, useMemo, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import NewsCard from '../components/NewsCard'
import { searchNews } from '../lib/news'
import type { NewsItem } from '../lib/types'

function useQueryParam() {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search), [search])
}

export default function Search() {
  const query = useQueryParam().get('q') || ''
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    if (!query.trim()) {
      setItems([])
      return
    }
    setLoading(true)
    searchNews(query)
      .then((data) => {
        if (active) setItems(data)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [query])

  const externalUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`

  return (
    <section className="lp-page">
      <div className="lp-search-hero">
        <div>
          <h2>Search Local Ping</h2>
          <p>{query ? `Results for "${query}"` : 'Enter a search term to explore news.'}</p>
        </div>
        {query && (
          <div className="lp-search-actions">
            <span className="lp-search-count">{items.length} results</span>
            <a className="lp-button secondary" href={externalUrl} target="_blank" rel="noreferrer">
              View externally
            </a>
          </div>
        )}
      </div>

      {!query ? (
        <div className="lp-search-empty">
          <div>
            <h3>Try a topic</h3>
            <p>Traffic, sports, transport, health alerts, city politics.</p>
          </div>
          <Link to="/" className="lp-button secondary">
            Go back home
          </Link>
        </div>
      ) : loading ? (
        <div className="lp-state">Searching...</div>
      ) : items.length === 0 ? (
        <div className="lp-search-empty">
          <div>
            <h3>No local results</h3>
            <p>Try another keyword or view this search externally.</p>
          </div>
          <a className="lp-button secondary" href={externalUrl} target="_blank" rel="noreferrer">
            View externally
          </a>
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
