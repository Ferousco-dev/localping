import { useEffect, useState } from 'react'
import NewsCard from '../components/NewsCard'
import { getUpdatesNews } from '../lib/news'
import type { NewsItem } from '../lib/types'

export default function Updates() {
  const [updates, setUpdates] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getUpdatesNews()
      .then((items) => {
        if (active) setUpdates(items)
      })
      .catch(() => {
        if (active) setError('Unable to load updates right now.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <section className="lp-page">
      <div className="lp-page-header">
        <div>
          <h2>Updates</h2>
          <p>General news, national reports, and curated alerts.</p>
        </div>
      </div>

      {loading ? (
        <div className="lp-news-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="lp-news-skeleton">
              <div className="lp-skeleton-content">
                <span className="lp-skeleton-line sm"></span>
                <span className="lp-skeleton-line"></span>
                <span className="lp-skeleton-line lg"></span>
                <span className="lp-skeleton-line sm"></span>
              </div>
              <div className="lp-skeleton-image"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="lp-state">{error}</div>
      ) : updates.length === 0 ? (
        <div className="lp-state">No updates published yet.</div>
      ) : (
        <div className="lp-news-grid">
          {updates.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  )
}
