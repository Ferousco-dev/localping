import { useEffect, useMemo, useState } from 'react'
import NewsCard from '../components/NewsCard'
import { useAuth } from '../context/AuthContext'
import { getNewsByLocation } from '../lib/news'
import { getFollowedSourceIds, getSources } from '../lib/sources'
import type { NewsItem } from '../lib/types'

export default function Home() {
  const { user } = useAuth()
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'general' | 'following'>('general')
  const [followedSources, setFollowedSources] = useState<string[]>([])

  const location = user?.location || 'Lagos, Nigeria'

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getNewsByLocation(location)
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

  useEffect(() => {
    let active = true
    if (!user) {
      setFollowedSources([])
      return
    }
    Promise.all([getSources(), getFollowedSourceIds(user.id)]).then(([sources, ids]) => {
      if (!active) return
      const names = sources.filter((source) => ids.includes(source.id)).map((source) => source.name)
      setFollowedSources(names)
    })
    return () => {
      active = false
    }
  }, [user])

  const filteredNews = useMemo(() => {
    if (tab === 'general') return news
    if (!followedSources.length) return []
    return news.filter((item) => followedSources.includes(item.source))
  }, [news, tab, followedSources])

  return (
    <section className="lp-page">
      <div className="lp-page-header">
        <div>
          <h2>Local briefing for {location}</h2>
          <p>Verified updates from your city and followed sources.</p>
        </div>
        <div className="lp-location-tag">Location · {location}</div>
      </div>

      <div className="lp-home-tabs">
        <button
          className={tab === 'general' ? 'lp-tab-button active' : 'lp-tab-button'}
          onClick={() => setTab('general')}
        >
          General
        </button>
        <button
          className={tab === 'following' ? 'lp-tab-button active' : 'lp-tab-button'}
          onClick={() => setTab('following')}
        >
          Following
        </button>
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
      ) : tab === 'following' && !user ? (
        <div className="lp-state">Log in to see news from followed sources.</div>
      ) : filteredNews.length === 0 ? (
        <div className="lp-state">No stories yet for this view.</div>
      ) : (
        <div className="lp-news-grid">
          {filteredNews.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  )
}
