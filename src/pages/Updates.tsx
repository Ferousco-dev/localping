import { useEffect, useState } from 'react'
import NewsCard from '../components/NewsCard'
import { getUpdatesNews } from '../lib/news'
import { getApiUpdatesEnabled } from '../lib/storage'
import type { NewsItem } from '../lib/types'

export default function Updates() {
  const [updates, setUpdates] = useState<NewsItem[] | null>(null)
  const [error, setError] = useState('')
  const [apiUpdatesEnabled, setApiUpdatesEnabled] = useState(getApiUpdatesEnabled())

  useEffect(() => {
    if (!apiUpdatesEnabled) return
    let active = true
    queueMicrotask(() => {
      if (active) {
        setError('')
        setUpdates(null)
      }
    })
    getUpdatesNews()
      .then((items) => {
        if (active) setUpdates(items)
      })
      .catch(() => {
        if (active) setError('Unable to load updates right now.')
      })
    return () => {
      active = false
    }
  }, [apiUpdatesEnabled])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'localping_api_updates_enabled') {
        setApiUpdatesEnabled(getApiUpdatesEnabled())
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  return (
    <section className="lp-page">
      <div className="lp-page-header">
        <div>
          <h2>Updates</h2>
          <p>General news, national reports, and curated alerts.</p>
        </div>
      </div>

      {!apiUpdatesEnabled ? (
        <div className="lp-state">Updates are paused by the admin.</div>
      ) : updates === null && !error ? (
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
      ) : (updates?.length ?? 0) === 0 ? (
        <div className="lp-state">No updates published yet.</div>
      ) : (
        <div className="lp-news-grid">
          {updates?.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  )
}
