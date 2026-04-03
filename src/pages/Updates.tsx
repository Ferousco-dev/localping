import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApiUpdatesEnabled } from '../lib/storage'

export default function Updates() {
  const [apiUpdatesEnabled, setApiUpdatesEnabled] = useState(getApiUpdatesEnabled())
  const navigate = useNavigate()

  useEffect(() => {
    if (apiUpdatesEnabled) navigate('/community?tab=updates', { replace: true })
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
      ) : (
        <div className="lp-state">Redirecting to Community updates…</div>
      )}
    </section>
  )
}
