import { Link } from 'react-router-dom'
import type { NewsItem } from '../lib/types'

export default function NewsCard({ item }: { item: NewsItem }) {
  const image =
    item.image ||
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=640&q=80'
  const formatLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)
  const categoryLabel = item.category || (item.newsType === 'community' ? 'Community' : 'General')
  const sourceLabel = item.authorName || item.source
  return (
    <Link to={`/news/${encodeURIComponent(item.id)}`} className="lp-news-card">
      <div className="lp-news-content">
        <div className="lp-news-tags">
          {categoryLabel && <span className="lp-chip">{formatLabel(categoryLabel)}</span>}
          {item.newsType === 'update' && <span className="lp-chip accent">Update</span>}
          {item.verified && <span className="lp-chip verified">Verified</span>}
        </div>
        <div className="lp-news-source">{sourceLabel}</div>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        <div className="lp-news-meta">{new Date(item.date).toLocaleString()}</div>
      </div>
      <div className="lp-news-image">
        <img src={image} alt={item.title} loading="lazy" />
      </div>
    </Link>
  )
}
