import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Updates() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/community?tab=updates', { replace: true })
  }, [navigate])

  return (
    <section className="lp-page">
      <div className="lp-page-header">
        <div>
          <h2>Updates</h2>
          <p>General news, national reports, and curated alerts.</p>
        </div>
      </div>

      <div className="lp-state">Redirecting to Community updates…</div>
    </section>
  )
}
