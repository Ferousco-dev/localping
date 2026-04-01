import { useEffect, useState } from 'react'
import { Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { updateUser } from '../lib/auth'
import { getFlaggedNews, getLikedNews, getPendingNewsByUser, getUserPosts } from '../lib/news'
import type { NewsItem, User } from '../lib/types'

function ProfileContent({
  user,
  isAdmin,
  onLogout,
  onRefresh,
}: {
  user: User;
  isAdmin: boolean;
  onLogout: () => void;
  onRefresh: () => Promise<void>;
}) {
  const [name, setName] = useState(user.name)
  const [location, setLocation] = useState(user.location)
  const [saving, setSaving] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [pendingPosts, setPendingPosts] = useState<Array<{ id: string; title: string; date: string }>>([])
  const [userPosts, setUserPosts] = useState<NewsItem[]>([])
  const [flaggedPosts, setFlaggedPosts] = useState<NewsItem[]>([])
  const [likedCount, setLikedCount] = useState(0)
  const formatLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

  useEffect(() => {
    getPendingNewsByUser(user.id).then((items) => {
      setPendingPosts(
        items.map((item) => ({
          id: item.id,
          title: item.title,
          date: item.date,
        })),
      )
    })
    getUserPosts(user.id).then((items) => {
      setUserPosts(items)
    })
    getFlaggedNews(user.id).then((items) => {
      setFlaggedPosts(items)
    })
    getLikedNews(user.id).then((items) => {
      setLikedCount(items.length)
    })
  }, [user.id])

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    await updateUser({ ...user, name: name.trim(), location: location.trim() })
    await onRefresh()
    setSaving(false)
  }

  return (
    <section className="lp-page lp-profile">
      <div className="lp-profile-hero">
        <div className="lp-profile-hero-main">
          <div className="lp-profile-avatar">
            <img src="/localping.jpeg" alt="LocalPing logo" />
          </div>
          <div className="lp-profile-heading">
            <span className="lp-profile-eyebrow">Neighborhood contributor</span>
            <h2>{user.name}</h2>
            <p>{user.email}</p>
            <div className="lp-profile-location">Based in {user.location}</div>
          </div>
        </div>
        <div className="lp-profile-hero-meta">
          <div className="lp-profile-badges">
            {isAdmin && <span className="lp-badge">Admin</span>}
            {user.autoPublish && <span className="lp-badge subtle">Auto-post enabled</span>}
          </div>
          <div className="lp-profile-hero-stats">
            <div>
              <span>Posts</span>
              <strong>{userPosts.length}</strong>
            </div>
            <div>
              <span>Pending</span>
              <strong>{pendingPosts.length}</strong>
            </div>
            <div>
              <span>Likes</span>
              <strong>{likedCount}</strong>
            </div>
          </div>
        </div>
        <div className="lp-profile-actions">
          <Link to="/post" className="lp-button">
            New post
          </Link>
          <Link to="/likes" className="lp-button secondary">
            Likes
          </Link>
          <Link to="/bookmarks" className="lp-button secondary">
            Bookmarks
          </Link>
          {isAdmin && (
            <Link to="/admin" className="lp-button secondary">
              Admin
            </Link>
          )}
        </div>
      </div>

      <div className="lp-profile-cards">
        <div className="lp-profile-card">
          <h3>Activity pulse</h3>
          <p>How your updates resonate in the feed.</p>
          <div className="lp-activity-card">
            <div className="lp-activity-item">
              <span>Likes</span>
              <strong>{likedCount}</strong>
            </div>
            <div className="lp-activity-item">
              <span>Flags</span>
              <strong>{flaggedPosts.length}</strong>
            </div>
            <div className="lp-activity-item">
              <span>Stories</span>
              <strong>{userPosts.length}</strong>
            </div>
          </div>
        </div>
        <div className="lp-profile-card">
          <h3>Community status</h3>
          <p>{user.autoPublish ? 'Auto-posting is enabled.' : 'Posts wait for approval.'}</p>
          <div className="lp-inline-actions">
            <span className="lp-pill">{userPosts.length} posts</span>
            <span className="lp-pill">{pendingPosts.length} waiting</span>
            <span className="lp-pill muted">{flaggedPosts.length} flagged</span>
          </div>
        </div>
        <div className="lp-profile-card">
          <h3>Profile settings</h3>
          <p>Update how you appear across LocalPing.</p>
          <button
            className="lp-profile-settings-button"
            type="button"
            onClick={() => setShowSettings((prev) => !prev)}
          >
            <span>Edit profile</span>
            <Settings size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {showSettings && (
        <form className="lp-form lp-profile-panel" onSubmit={handleSave}>
          <div>
            <h3>Profile settings</h3>
            <p>Update how you appear across LocalPing.</p>
          </div>
          <label>
            Display name
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            Email address
            <input value={user.email} readOnly />
          </label>
          <label>
            Primary location
            <input value={location} onChange={(event) => setLocation(event.target.value)} />
          </label>
          <div className="lp-inline-actions">
            <button className="lp-button" type="submit" disabled={saving}>
              Save updates
            </button>
            <button className="lp-button secondary" type="button" onClick={() => onLogout()}>
              Sign out
            </button>
          </div>
        </form>
      )}

      <div className="lp-profile-split">
        <div className="lp-profile-panel">
          <div>
            <h3>Approval queue</h3>
            <p>Pending posts stay here until approved.</p>
          </div>
          <div className="lp-stack">
            {pendingPosts.length === 0 && <div className="lp-state">No waiting posts yet.</div>}
            {pendingPosts.map((post) => (
              <div key={post.id} className="lp-inline-row">
                <div>
                  <strong>{post.title}</strong>
                  <p>Submitted {new Date(post.date).toLocaleDateString()}</p>
                </div>
                <span className="lp-pill muted">Waiting</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lp-profile-panel">
          <div>
            <h3>Your posts</h3>
            <p>Track the updates you have submitted.</p>
          </div>
          <div className="lp-stack">
            {userPosts.length === 0 && <div className="lp-state">No posts yet.</div>}
            {userPosts.map((post) => (
              <Link key={post.id} to={`/news/${encodeURIComponent(post.id)}`} className="lp-post-row">
                <div>
                  <strong>{post.title}</strong>
                  <p>
                    {post.category ? `${formatLabel(post.category)} · ` : ''}
                    {post.status === 'approved' ? 'Live' : 'Pending'}
                  </p>
                </div>
                {post.verified && <span className="lp-pill">Verified</span>}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="lp-profile-panel">
        <div>
          <h3>Flagged posts</h3>
          <p>Stories you flagged for review.</p>
        </div>
        <div className="lp-stack">
          {flaggedPosts.length === 0 && <div className="lp-state">No flagged posts.</div>}
          {flaggedPosts.map((post) => (
            <div key={post.id} className="lp-inline-row">
              <div>
                <strong>{post.title}</strong>
                <p>{post.authorName || post.source}</p>
              </div>
              <span className="lp-pill muted">Flagged</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function Profile() {
  const { user, logout, refresh, isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <section className="lp-page">
        <div className="lp-profile-skeleton">
          <div className="lp-skeleton-card"></div>
          <div className="lp-skeleton-card"></div>
          <div className="lp-skeleton-card tall"></div>
        </div>
      </section>
    )
  }

  if (!user) {
    return (
      <section className="lp-page">
        <div className="lp-state">
          <p>You are not signed in.</p>
          <div className="lp-inline-actions">
            <Link to="/login" className="lp-button">
              Log in
            </Link>
            <Link to="/signup" className="lp-button secondary">
              Create account
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <ProfileContent
      key={user.id}
      user={user}
      isAdmin={isAdmin}
      onLogout={() => void logout()}
      onRefresh={refresh}
    />
  )
}
