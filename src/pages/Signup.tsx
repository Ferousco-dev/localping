import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const { signup, user, loading } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [location, setLocation] = useState('Lagos, Nigeria')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) navigate('/')
  }, [user, loading, navigate])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    const result = await signup({ name, email, password, location })
    if (!result.ok) {
      setError(result.error || 'Unable to sign up.')
      setSubmitting(false)
      return
    }
    navigate('/')
  }

  return (
    <section className="lp-page lp-auth">
      <div className="lp-auth-card">
        <h2>Create account</h2>
        <p>Set your preferred city. We do not require device location.</p>
        <form className="lp-form" onSubmit={handleSubmit}>
          <label>
            Full name
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          <label>
            Location
            <input value={location} onChange={(event) => setLocation(event.target.value)} required />
          </label>
          {error && <div className="lp-error">{error}</div>}
          <button className="lp-button" type="submit" disabled={submitting}>
            {submitting ? (
              <span className="lp-button-loader" aria-label="Loading">
                <span aria-hidden="true"></span>
              </span>
            ) : (
              'Create account'
            )}
          </button>
        </form>
        <p className="lp-auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </section>
  )
}
