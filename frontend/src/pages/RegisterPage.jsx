import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader2 } from 'lucide-react'

const BG_GRADIENT   = 'linear-gradient(135deg, #FAF5FF 20%, #E8E5FF 100%)'
const CARD_GRADIENT = 'linear-gradient(315deg, #42055C 20%, #7277F1 100%)'

function validate(email, password, confirm) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Please enter a valid email address.'
  }
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters.'
  }
  if (password !== confirm) {
    return 'Passwords do not match.'
  }
  return null
}

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate     = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const validationError = validate(email, password, confirm)
    if (validationError) {
      setError(validationError)
      return
    }
    setLoading(true)
    try {
      await register(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message ?? 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: BG_GRADIENT }}
    >
      <div
        className="w-full flex flex-col md:flex-row rounded-2xl overflow-hidden"
        style={{
          maxWidth: 900,
          minHeight: 600,
          boxShadow: '0 25px 60px rgba(55, 48, 163, 0.45), 0 8px 24px rgba(79, 70, 229, 0.25)',
        }}
      >

        {/* ── Left: Brand panel ── */}
        <div
          className="hidden md:flex md:w-5/12 relative text-white overflow-hidden"
          style={{ background: CARD_GRADIENT }}
        >
          {/* SECTION 1 — Logo */}
          <div className="absolute left-0 right-0 text-center" style={{ top: 120 }}>
            <p className="text-4xl"><span className="font-medium text-white">Innovat</span><span className="font-bold text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>&lt;epam&gt;</span></p>

            {/* SECTION 2 — Headline */}
            <div style={{ marginTop: 40 }} className="text-left inline-block">
              <p className="text-2xl font-semibold italic tracking-wide leading-relaxed text-white/70">Innovate.</p>
              <p className="text-2xl font-semibold italic tracking-wide leading-relaxed text-white/70">Collaborate.</p>
              <p className="text-2xl font-semibold italic tracking-wide leading-relaxed text-white/70">Transform.</p>
            </div>
          </div>

          {/* SECTION 3 — Quote */}
          <div className="absolute left-0 right-0 text-center max-w-xs mx-auto" style={{ bottom: 48, left: 0, right: 0 }}>
            <p className="text-sm font-light italic text-white/50">"Every great innovation starts with an idea"</p>
          </div>
        </div>

        {/* ── Mobile-only top bar ── */}
        <div
          className="md:hidden flex items-center justify-center py-7 px-6 text-white"
          style={{ background: CARD_GRADIENT }}
        >
          <p className="text-xl"><span className="font-medium text-white">Innovat</span><span className="font-bold text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>&lt;epam&gt;</span></p>
        </div>

        {/* ── Right: Form panel ── */}
        <div className="flex-1 bg-white flex items-center justify-center px-10 py-16">
          <div className="w-full max-w-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Create an account</h2>
            <p className="text-sm text-gray-500 mb-8">Join the portal to share and track your ideas.</p>

            {error && (
              <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@epam.com"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="confirm" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Confirm password
                </label>
                <input
                  id="confirm"
                  type="password"
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="w-full rounded-xl py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 mt-2"
                style={{ background: CARD_GRADIENT, boxShadow: '0 4px 16px rgba(79, 70, 229, 0.45)' }}
              >
                {loading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Creating account…
                  </span>
                ) : 'Create account'}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-violet-600 hover:text-violet-500 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
