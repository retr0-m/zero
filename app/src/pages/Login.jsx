import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login, getMe } from '../api/client'
import { useAuthStore } from '../stores/authStore'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await login(email, password)
      useAuthStore.getState().token = data.access_token // set user to null until user fetch it
      const meRes = await getMe() // now token is attached
      setAuth(data.access_token, meRes.data) // update store properly

      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* logo */}
        <div className="mb-8 text-center">
          <span className="font-mono text-xl font-medium tracking-tight">
            zero<span style={{ color: '#c8ff00' }}>to</span>
          </span>
          <p className="text-xs text-zinc-500 mt-1 font-mono">from idea to business plan</p>
        </div>

        <div className="rounded-2xl border border-white/6 bg-zinc-900/60 p-6 backdrop-blur-sm">
          <h1 className="text-sm font-medium text-zinc-200 mb-5">Sign in</h1>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-zinc-800/60 border border-white/6 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-[#c8ff00]/40 focus:ring-1 focus:ring-[#c8ff00]/20 transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-zinc-800/60 border border-white/6 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-[#c8ff00]/40 focus:ring-1 focus:ring-[#c8ff00]/20 transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 font-mono">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 py-2 rounded-lg text-sm font-medium transition-all duration-150 disabled:opacity-50"
              style={{ background: '#c8ff00', color: '#0a0a0a' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-4">
          No account?{' '}
          <Link to="/register" className="text-zinc-400 hover:text-zinc-200 transition-colors">
            Create one free →
          </Link>
        </p>
      </div>
    </div>
  )
}
