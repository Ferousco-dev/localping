import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { updateUser } from '../lib/auth'

export default function Profile() {
  const { user, logout, refresh, isAdmin, loading } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [location, setLocation] = useState(user?.location || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setLocation(user.location)
    }
  }, [user])

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

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    await updateUser({ ...user, name: name.trim(), location: location.trim() })
    await refresh()
    setSaving(false)
  }

  return (
    <section className="lp-page">
      <div className="lp-profile-header">
        <div>
          <h2>Profile</h2>
          <p>Manage your local preferences and account details.</p>
        </div>
        {isAdmin && <span className="lp-badge">Admin</span>}
      </div>

      <div className="lp-profile-grid">
        <div className="lp-profile-card">
          <div className="lp-profile-avatar">
            <span>{user.name.slice(0, 1).toUpperCase()}</span>
          </div>
          <div>
            <h3>{user.name}</h3>
            <p>{user.email}</p>
            <div className="lp-profile-location">{user.location}</div>
          </div>
        </div>

        <div className="lp-profile-card">
          <h3>Your library</h3>
          <p>Quick access to saved and liked stories.</p>
          <div className="lp-inline-actions">
            <Link to="/likes" className="lp-button secondary">
              Likes
            </Link>
            <Link to="/bookmarks" className="lp-button secondary">
              Bookmarks
            </Link>
          </div>
        </div>
      </div>

      <form className="lp-form lp-profile-form" onSubmit={handleSave}>
        <label>
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          Email
          <input value={user.email} readOnly />
        </label>
        <label>
          Location
          <input value={location} onChange={(event) => setLocation(event.target.value)} />
        </label>
        <div className="lp-inline-actions">
          <button className="lp-button" type="submit" disabled={saving}>
            Save changes
          </button>
          <button className="lp-button secondary" type="button" onClick={() => void logout()}>
            Log out
          </button>
        </div>
      </form>
    </section>
  )
}
