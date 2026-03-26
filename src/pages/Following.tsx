import { useEffect, useState } from 'react'
import SourceCard from '../components/SourceCard'
import { useAuth } from '../context/AuthContext'
import { getFollowedSourceIds, getSources, toggleFollow } from '../lib/sources'
import type { Source } from '../lib/types'

export default function Following() {
  const { user } = useAuth()
  const [sources, setSources] = useState<Source[]>([])
  const [following, setFollowing] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getSources()
      .then((items) => {
        if (active) setSources(items)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    if (user) {
      getFollowedSourceIds(user.id).then((ids) => {
        if (active) setFollowing(ids)
      })
    }
    return () => {
      active = false
    }
  }, [user])

  const handleToggle = async (id: string) => {
    if (!user) return
    const isFollowing = await toggleFollow(user.id, id)
    setFollowing((prev) => (isFollowing ? [...prev, id] : prev.filter((item) => item !== id)))
  }

  if (!user) {
    return (
      <section className="lp-page">
        <div className="lp-state">Create an account to follow sources.</div>
      </section>
    )
  }

  return (
    <section className="lp-page">
      <div className="lp-page-header">
        <div>
          <h2>Following</h2>
          <p>Choose which news plugs to follow for alerts.</p>
        </div>
      </div>
      {loading ? (
        <div className="lp-stack">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="lp-source-skeleton">
              <div className="lp-skeleton-content">
                <span className="lp-skeleton-line sm"></span>
                <span className="lp-skeleton-line lg"></span>
                <span className="lp-skeleton-line"></span>
              </div>
              <div className="lp-skeleton-pill"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="lp-stack">
          {sources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              isFollowing={following.includes(source.id)}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}
    </section>
  )
}
