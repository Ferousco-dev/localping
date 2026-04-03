import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import ActionBar from '../components/ActionBar'
import { getNewsById } from '../lib/news'
import type { NewsItem } from '../lib/types'

export default function NewsDetail() {
  const { id } = useParams()
  const decodedId = id ? decodeURIComponent(id) : null
  const [news, setNews] = useState<NewsItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    if (!decodedId) {
      Promise.resolve().then(() => {
        if (!active) return
        setLoading(false)
      })
      return
    }
    Promise.resolve().then(() => {
      if (!active) return
      setLoading(true)
    })
    getNewsById(decodedId)
      .then((item) => {
        if (active) setNews(item)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [decodedId])

  if (loading) {
    return (
      <section className="lp-page">
        <div className="lp-state">Loading story...</div>
      </section>
    )
  }

  if (!news) {
    return (
      <section className="lp-page">
        <div className="lp-state">
          We could not find that story. <Link to="/">Go back</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="lp-page">
      <div className="lp-article">
        <div className="lp-article-hero">
          <img src={news.image} alt={news.title} />
          <div className="lp-article-meta">
            <span>{news.authorName || news.source}</span>
            <span>{new Date(news.date).toLocaleString()}</span>
          </div>
        </div>
        <div className="lp-article-tags">
          {news.category && <span className="lp-chip">{news.category}</span>}
          {news.newsType === 'update' && <span className="lp-chip accent">Update</span>}
          {news.verified && <span className="lp-chip verified">Verified</span>}
        </div>
        <h1>{news.title}</h1>
        <p className="lp-article-description">{news.description}</p>
        <p>{news.content}</p>
        {news.url && (
          <a href={news.url} target="_blank" rel="noreferrer" className="lp-link">
            Read from source
          </a>
        )}
      </div>
      <ActionBar
        newsId={news.id}
        shareUrl={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/og?id=${encodeURIComponent(news.id)}`}
        news={news}
      />
    </section>
  )
}
