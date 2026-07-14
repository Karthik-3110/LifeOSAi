import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import { useAuth } from '../context/useAuth.js'
import logoImage from '../assets/logo.png'

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { authError, isAuthenticated, loading, loginWithEmail, loginWithGoogle, signupWithEmail } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname || '/dashboard'

  if (!loading && isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const finishAuth = async (callback) => {
    setSubmitting(true)
    setError('')
    try {
      await callback()
      navigate(redirectTo, { replace: true })
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEmailSubmit = (event) => {
    event.preventDefault()
    finishAuth(() => (
      mode === 'signup'
        ? signupWithEmail(form)
        : loginWithEmail(form.email, form.password)
    ))
  }

  return (
    <main className="grid min-h-screen bg-bg-base text-text-primary lg:grid-cols-2">
      <section className="relative hidden overflow-hidden border-r border-border-subtle bg-bg-surface p-12 lg:flex lg:flex-col lg:justify-between">
        <div>
          <img src={logoImage} alt="LifeOS AI" className="h-16 w-16 rounded-2xl object-cover surface-shadow" />
          <p className="mt-2 text-text-secondary">Your visual second brain.</p>
        </div>
        <blockquote className="max-w-xl">
          <p className="font-display text-4xl font-semibold leading-tight text-text-primary">"It&apos;s the first AI product that doesn&apos;t feel like a chatbot. It feels like a co-founder."</p>
          <footer className="mt-6 text-text-secondary">Priya N. - Solo builder</footer>
        </blockquote>
        <div className="absolute bottom-16 right-16 h-44 w-44 rounded-full border border-accent-signal/20" />
      </section>
      <section className="flex items-center justify-center px-4 py-16 sm:px-6">
        <div className="w-full max-w-md">
          <img src={logoImage} alt="LifeOS AI" className="mb-10 h-14 w-14 rounded-2xl object-cover surface-shadow lg:hidden" />
          <h1 className="font-display text-4xl font-bold text-text-primary">Welcome back</h1>
          <p className="mt-3 text-text-secondary">Sign in to your second brain</p>
          <div className="mt-8 space-y-3">
            <Button variant="secondary" size="lg" className="w-full" disabled={submitting || loading} onClick={() => finishAuth(loginWithGoogle)}>
              <span className="font-bold">G</span> Continue with Google
            </Button>
          </div>
          <div className="my-8 flex items-center gap-4 text-xs uppercase tracking-[0.18em] text-text-muted">
            <span className="h-px flex-1 bg-border-subtle" /> or <span className="h-px flex-1 bg-border-subtle" />
          </div>
          <div className="mb-5 grid grid-cols-2 rounded-full border border-border-subtle bg-bg-elevated p-1">
            {['login', 'signup'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
                  mode === item ? 'bg-accent-signal text-text-primary' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <form className="space-y-4" onSubmit={handleEmailSubmit}>
            {mode === 'signup' && (
              <label className="grid gap-2 text-sm font-medium text-text-secondary">
                Full name
                <input
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  className="rounded-xl border border-border-subtle bg-bg-base px-4 py-3 text-text-primary outline-none transition focus:border-accent-signal focus:ring-2 focus:ring-accent-signal/20"
                  autoComplete="name"
                />
              </label>
            )}
            <label className="grid gap-2 text-sm font-medium text-text-secondary">
              Email
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={updateField}
                className="rounded-xl border border-border-subtle bg-bg-base px-4 py-3 text-text-primary outline-none transition focus:border-accent-signal focus:ring-2 focus:ring-accent-signal/20"
                autoComplete="email"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-text-secondary">
              Password
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={updateField}
                className="rounded-xl border border-border-subtle bg-bg-base px-4 py-3 text-text-primary outline-none transition focus:border-accent-signal focus:ring-2 focus:ring-accent-signal/20"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                minLength={6}
                required
              />
            </label>
            {(error || authError) && (
              <div className="rounded-xl border border-node-deadline/30 bg-node-deadline/10 px-4 py-3 text-sm text-node-deadline">
                {error || authError}
              </div>
            )}
            <Button size="lg" className="w-full" type="submit" disabled={submitting || loading}>
              <Mail size={18} /> {submitting ? 'Working...' : mode === 'signup' ? 'Create account' : 'Continue with email'}
            </Button>
          </form>
          <p className="mt-6 text-center text-xs leading-5 text-text-muted">By continuing you agree to our Terms & Privacy.</p>
        </div>
      </section>
    </main>
  )
}
