import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/client'
import { useAuthStore } from '../stores/authStore'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const { data } = await register(email, password)
      if (data.detail) throw new Error(data.detail)
      setAuth(data.access_token, null)
      navigate('/')
    } catch (err) { setError(err.response?.data?.detail || err.message) }
  }

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tighter text-white">
            zero<span style={{ color: '#c8ff00' }}>to</span>
          </h1>
          <p className="text-zinc-500 mt-2 text-sm uppercase tracking-widest font-mono">
            Build it stronger
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#c8ff00] transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#c8ff00] transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="w-full py-3 mt-4 rounded-lg font-bold text-black transition-transform hover:brightness-110 active:scale-[0.98]"
            style={{ backgroundColor: '#c8ff00' }}
          >
            Create Account
          </button>
        </form>
        {error && <p className="text-red-400 text-sm mt-1 text-left">{error}</p>}

        <p className="text-center text-zinc-500 text-xs">
          Already a builder?{' '}
          <Link to="/login" className="text-zinc-300 hover:text-[#c8ff00] underline underline-offset-4 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}


