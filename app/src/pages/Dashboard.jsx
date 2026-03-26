import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import IdeaView from '../components/idea/IdeaView'
import NewIdea from './NewIdea'
import { listIdeas } from '../api/client'

function EmptyState({ onNew }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-xs">
        <div className="w-12 h-12 rounded-2xl border border-white/8 bg-zinc-900 flex items-center justify-center mx-auto mb-4">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 4v12M4 10h12" stroke="#c8ff00" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="text-sm font-medium text-zinc-300 mb-2">No idea selected</h2>
        <p className="text-xs text-zinc-600 leading-relaxed mb-4">
          Pick one from the sidebar or start a fresh analysis.
        </p>
        <button
          onClick={onNew}
          className="px-4 py-2 rounded-lg text-xs font-mono font-medium transition-all"
          style={{ background: '#c8ff00', color: '#0a0a0a' }}
        >
          Analyze new idea
        </button>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [ideas, setIdeas] = useState([])
  const [loadingIdeas, setLoadingIdeas] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  async function fetchIdeas() {
    try {
      console.log("Fetching ideas...")
      const { data } = await listIdeas()
      setIdeas(data)
    } catch {
      console.log("Failed to fetch ideas")
      // silent — auth error handled by interceptor
    } finally {
      setLoadingIdeas(false)
    }
  }

  useEffect(() => { fetchIdeas() }, [])

  // derive selected id from URL
  const match = location.pathname.match(/\/ideas\/([^/]+)/)
  const selectedId = match ? match[1] : null

  function handleIdeaSaved(newIdea) {
    setIdeas((prev) => [newIdea, ...prev])
    navigate(`/ideas/${newIdea.id}`)
  }

  function handleIdeaDeleted(id) {
    setIdeas((prev) => prev.filter((i) => i.id !== id))
    navigate('/')
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
      {/* mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 border-b border-white/5 bg-zinc-950/90 backdrop-blur-sm">
        <button onClick={() => setMobileOpen(true)} className="text-zinc-400 hover:text-zinc-200 transition-colors">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <span className="font-mono text-sm font-medium">
          zero<span style={{ color: '#c8ff00' }}>to</span>
        </span>
        <button
          onClick={() => navigate('/ideas/new')}
          className="text-xs font-mono px-2.5 py-1 rounded-lg"
          style={{ background: '#c8ff00', color: '#0a0a0a' }}
        >
          + New
        </button>
      </div>

      <Sidebar
        ideas={ideas}
        loading={loadingIdeas}
        selectedId={selectedId}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* main content */}
      <main className="flex-1 overflow-hidden flex flex-col md:pt-0 pt-12">
        <Routes>
          <Route
            path="/"
            element={<EmptyState onNew={() => navigate('/ideas/new')} />}
          />
          <Route
            path="/ideas/new"
            element={<NewIdea onSaved={handleIdeaSaved} />}
          />
          <Route
            path="/ideas/:id"
            element={
              <IdeaViewWrapper
                onDeleted={handleIdeaDeleted}
                onIdeaChange={fetchIdeas}
              />
            }
          />
        </Routes>
      </main>
    </div>
  )
}

function IdeaViewWrapper({ onDeleted, onIdeaChange }) {
  const { id } = useParams()
  return <IdeaView key={id} ideaId={id} onDeleted={onDeleted} onIdeaChange={onIdeaChange} />
}
