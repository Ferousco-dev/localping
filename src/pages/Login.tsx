import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, user, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) navigate('/')
  }, [user, loading, navigate])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    const result = await login({ email, password })
    if (!result.ok) {
      setError(result.error || 'Unable to log in.')
      setSubmitting(false)
      return
    }
    navigate('/')
  }

  return (
    <section className="lp-page lp-auth">
      <div className="lp-auth-card">
        <h2>Welcome back</h2>
        <p>Log in to track local updates and saved stories.</p>
        <form className="lp-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error && <div className="lp-error">{error}</div>}
          <button className="lp-button" type="submit" disabled={submitting}>
            {submitting ? (
              <span className="lp-button-loader" aria-label="Loading">
                <span aria-hidden="true"></span>
              </span>
            ) : (
              'Log in'
            )}
          </button>
        </form>
        <p className="lp-auth-footer">
          New here? <Link to="/signup">Create account</Link>
        </p>
      </div>
    </section>
  )
}
