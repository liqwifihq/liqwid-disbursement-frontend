import axios from 'axios'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { FormEvent, useState } from 'react'
import { errorMessage } from '../lib/api'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await axios.post('/api/auth/login', { email, password })
      const requested = typeof router.query.returnTo === 'string' ? router.query.returnTo : '/'
      const destination = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/'
      await router.replace(destination)
    } catch (loginError) {
      setError(errorMessage(loginError, 'Sign in failed.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <Head><title>Admin sign in · LiqWiFi PayOps</title></Head>
      <div className="login-brand">
        <span className="brand-mark" aria-hidden="true"><span /></span>
        <span><strong>LiqWiFi</strong><small>PAYOPS</small></span>
      </div>
      <main className="login-card">
        <div className="login-heading">
          <span className="login-lock" aria-hidden="true">⌁</span>
          <p className="eyebrow">Restricted workspace</p>
          <h1>Welcome back</h1>
          <p>Sign in with your administrator credentials to manage payment batches.</p>
        </div>
        {error && <div className="login-error" role="alert">{error}</div>}
        <form onSubmit={submit}>
          <label>
            <span>Admin email</span>
            <input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@example.com" required autoFocus />
          </label>
          <label>
            <span>Password</span>
            <div className="password-input">
              <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? 'Hide' : 'Show'}</button>
            </div>
          </label>
          <button className="btn btn-primary btn-login" disabled={loading}>
            {loading ? <><span className="spinner" />Signing in…</> : 'Sign in to PayOps'}
          </button>
        </form>
        <p className="login-help">Credentials are managed through secure environment variables.</p>
      </main>
      <footer className="login-footer"><span>LIQWIFI FINANCE OPERATIONS</span><span>Protected administrative access</span></footer>
    </div>
  )
}
