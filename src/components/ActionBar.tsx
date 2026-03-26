import { Bookmark, Heart, Share2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import type { NewsItem } from '../lib/types'
import { getBookmarkStatus, getLikeStatus, shareNews, toggleBookmark, toggleLike } from '../lib/news'

export default function ActionBar({
  newsId,
  shareUrl,
  news,
}: {
  newsId: string
  shareUrl?: string
  news: NewsItem
}) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let active = true
    if (!user) {
      setLiked(false)
      setBookmarked(false)
      return
    }
    Promise.all([getLikeStatus(user.id, newsId), getBookmarkStatus(user.id, newsId)]).then(
      ([likeStatus, bookmarkStatus]) => {
        if (!active) return
        setLiked(likeStatus)
        setBookmarked(bookmarkStatus)
      },
    )
    return () => {
      active = false
    }
  }, [user, newsId])

  const handleLike = async () => {
    if (!user) return
    const next = await toggleLike(user.id, newsId)
    setLiked(next)
  }

  const handleBookmark = async () => {
    if (!user) return
    const next = await toggleBookmark(user.id, newsId)
    setBookmarked(next)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: news.title,
          text: news.description,
          url: shareUrl || window.location.href,
        })
        return
      } catch {
        // fall back to modal
      }
    }
    setOpen(true)
  }

  return (
    <div className="lp-action-bar">
      <button className={liked ? 'lp-action active' : 'lp-action'} onClick={handleLike}>
        <Heart size={18} />
        Like
      </button>
      <button className={bookmarked ? 'lp-action active' : 'lp-action'} onClick={handleBookmark}>
        <Bookmark size={18} />
        Save
      </button>
      <button className="lp-action" onClick={handleShare}>
        <Share2 size={18} />
        Share
      </button>
      {open && (
        <div className="lp-share-modal" role="dialog" aria-modal="true">
          <div className="lp-share-panel">
            <button className="lp-share-close" onClick={() => setOpen(false)} aria-label="Close">
              <X size={16} />
            </button>
            <div className="lp-share-card">
              <div className="lp-share-content">
                <div className="lp-news-source">{news.source}</div>
                <h3>{news.title}</h3>
                <p>{news.description}</p>
              </div>
              <div className="lp-share-image">
                <img src={news.image} alt={news.title} />
              </div>
            </div>
            <div className="lp-share-actions">
              <button
                className="lp-button secondary"
                onClick={async () => {
                  await shareNews(shareUrl || window.location.href)
                }}
              >
                Copy link
              </button>
              {navigator.share && (
                <button
                  className="lp-button"
                  onClick={async () => {
                    await navigator.share({
                      title: news.title,
                      text: news.description,
                      url: shareUrl || window.location.href,
                    })
                  }}
                >
                  Share now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
