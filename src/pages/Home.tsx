import { useEffect, useMemo, useState } from 'react'
import NewsCard from '../components/NewsCard'
import { useAuth } from '../context/AuthContext'
import { getCommunityNewsByLocation } from '../lib/news'
import type { NewsItem } from '../lib/types'

export default function Home() {
  const { user } = useAuth()
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const location = user?.location || 'Lagos, Nigeria'
  const incidentCategories = ['traffic', 'accident', 'incident']

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getCommunityNewsByLocation(location)
      .then((items) => {
        if (active) setNews(items)
      })
      .catch(() => {
        if (active) setError('Unable to load local updates.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [location])

  const latestNews = useMemo(() => news.slice(0, 8), [news])
  const incidentNews = useMemo(
    () => news.filter((item) => item.category && incidentCategories.includes(item.category)).slice(0, 6),
    [news],
  )

  return (
    <section className="lp-page">
      <div className="lp-page-header">
        <div>
          <h2>Live updates for {location}</h2>
          <p>Community reports happening around you right now.</p>
        </div>
        <div className="lp-location-tag">Location · {location}</div>
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
      ) : news.length === 0 ? (
        <div className="lp-state">No community updates yet.</div>
      ) : (
        <div className="lp-stack">
          <div>
            <div className="lp-section-header">
              <div>
                <h3>Latest reports</h3>
                <p>Fresh posts from people near you.</p>
              </div>
            </div>
            <div className="lp-news-grid">
              {latestNews.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          </div>

          <div>
            <div className="lp-section-header">
              <div>
                <h3>Nearby incidents</h3>
                <p>Traffic, accidents, and urgent community alerts.</p>
              </div>
            </div>
            {incidentNews.length === 0 ? (
              <div className="lp-state">No incident reports yet.</div>
            ) : (
              <div className="lp-news-grid">
                {incidentNews.map((item) => (
                  <NewsCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
