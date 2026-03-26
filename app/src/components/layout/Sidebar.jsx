import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

function viabilityColor(score) {
  if (score >= 8) return '#c8ff00'
  if (score >= 6) return '#facc15'
  if (score >= 4) return '#f97316'
  return '#ef4444'
}

function IdeaCard({ idea, active, onClick }) {
  const color = viabilityColor(idea.viability_score)
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-100 group ${
        active
          ? 'bg-white/6 border border-white/8'
          : 'hover:bg-white/4 border border-transparent'
      }`}
    >
      <div className="flex items-center gap-2.5">
        {/* viability ring avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-mono font-medium flex-shrink-0 border"
          style={{ borderColor: color + '55', color, background: color + '12' }}
        >
          {idea.viability_score}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-zinc-200 truncate leading-tight">
            {idea.title}
          </div>
          <div className="text-[11px] text-zinc-500 truncate leading-tight mt-0.5">
            {idea.description}
          </div>
        </div>
      </div>
    </button>
  )
}

export default function Sidebar({ ideas, loading, selectedId, onSelect, mobileOpen, onClose }) {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)

  function handleNew() {
    navigate('/ideas/new')
    onClose?.()
  }

  function handleSelect(id) {
    navigate(`/ideas/${id}`)
    onSelect?.(id)
    onClose?.()
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const inner = (
    <div className="flex flex-col h-full">
      {/* header */}
      <div className="px-4 py-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
        <span className="font-mono text-sm font-medium tracking-tight">
          zero<span style={{ color: '#c8ff00' }}>to</span>
        </span>
        <button
          onClick={handleNew}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all"
          style={{ background: '#c8ff00', color: '#0a0a0a' }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          New idea
        </button>
      </div>

      {/* ideas list */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {loading ? (
          <div className="space-y-2 px-2">
            {[80, 65, 90].map((w, i) => (
              <div key={i} className="flex items-center gap-2.5 py-2.5">
                <div className="skel w-8 h-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="skel h-2.5 rounded" style={{ width: `${w}%` }} />
                  <div className="skel h-2 rounded" style={{ width: `${w - 20}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : ideas.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="text-xs text-zinc-600 leading-relaxed">
              No ideas yet.<br />
              <button onClick={handleNew} className="text-zinc-400 hover:text-zinc-200 underline underline-offset-2 transition-colors">
                Analyze your first idea →
              </button>
            </p>
          </div>
        ) : (
          ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              active={idea.id === selectedId}
              onClick={() => handleSelect(idea.id)}
            />
          ))
        )}
      </div>

      {/* footer */}
      <div className="px-4 py-3 border-t border-white/5 flex-shrink-0 flex items-center justify-between">
        <span className="text-[11px] text-zinc-600 truncate font-mono">{user?.email}</span>
        <button
          onClick={handleLogout}
          className="text-[11px] text-zinc-600 hover:text-zinc-400 font-mono transition-colors ml-2 flex-shrink-0"
        >
          out →
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col h-full border-r border-white/5 bg-zinc-950/80 flex-shrink-0">
        {inner}
      </aside>

      {/* mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <aside className="relative w-72 h-full bg-zinc-950 border-r border-white/5 flex flex-col z-10">
            {inner}
          </aside>
        </div>
      )}
    </>
  )
}
