import { useEffect, useState } from 'react'
import NewsCard from '../components/NewsCard'
import { useAuth } from '../context/AuthContext'
import { getCommunityNewsByLocation } from '../lib/news'
import type { NewsItem } from '../lib/types'

const categories = [
  'all',
  'event',
  'government',
  'school',
  'community',
  'service',
  'traffic',
  'accident',
  'incident',
]

export default function Community() {
  const { user } = useAuth()
  const location = user?.location || 'Lagos, Nigeria'
  const [activeCategory, setActiveCategory] = useState('all')
  const [posts, setPosts] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const formatLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getCommunityNewsByLocation(location, activeCategory)
      .then((items) => {
        if (active) setPosts(items)
      })
      .catch(() => {
        if (active) setError('Unable to load community updates.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [location, activeCategory])

  return (
    <section className="lp-page">
      <div className="lp-page-header">
        <div>
          <h2>Community</h2>
          <p>Events, services, and institutions around {location}.</p>
        </div>
        <div className="lp-location-tag">Location · {location}</div>
      </div>

      <div className="lp-category-row">
        {categories.map((category) => (
          <button
            key={category}
            className={activeCategory === category ? 'lp-tab-button active' : 'lp-tab-button'}
            onClick={() => setActiveCategory(category)}
          >
            {formatLabel(category)}
          </button>
        ))}
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
      ) : posts.length === 0 ? (
        <div className="lp-state">No community posts yet for this category.</div>
      ) : (
        <div className="lp-news-grid">
          {posts.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  )
}
