import { useState, useEffect } from 'react'
import { getIdea, deleteIdea } from '../../api/client'
import IdeaHeader from './IdeaHeader'
import MoneyTab from './tabs/MoneyTab'
import PlanTab from './tabs/PlanTab'
import ProblemsTab from './tabs/ProblemsTab'
import ChatTab from './tabs/ChatTab'
import PeopleTab from './tabs/PeopleTab'

const TABS = [
  { id: 'money', label: 'Money' },
  { id: 'plan', label: 'Plan' },
  { id: 'problems', label: 'Problems' },
  { id: 'chat', label: 'Chat' },
  { id: 'people', label: 'People' },
]



export default function IdeaView({ ideaId, onDeleted }) {
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('money');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const { data } = await getIdea(ideaId);
        setIdea(data);
      } catch {
        setError('Connection failed. Could not load idea.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [ideaId]);

  async function handleDelete() {
    if (!confirm('Permanent Action: Delete this idea?')) return;
    setDeleting(true);
    try {
      await deleteIdea(ideaId);
      onDeleted?.(ideaId);
    } catch {
      setDeleting(false);
    }
  }

  if (loading) return <LoadingSkeleton />;
  if (error) return (
    <div className="flex-1 flex items-center justify-center font-mono text-[10px] uppercase tracking-widest text-zinc-500">
      {error}
    </div>
  );
  if (!idea) return null;

  return (
    <div className="flex-1 overflow-y-auto bg-black text-zinc-200 selection:bg-white/10">
      <div className="max-w-4xl mx-auto px-6 py-10">

        <IdeaHeader idea={idea} />

        {/* Startup-Style Tab Bar */}
        <div className="flex items-center gap-2 mt-8 mb-10 p-1.5 bg-zinc-900/50 rounded-2xl border border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            {TABS.map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`
                    px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200
                    ${isActive
                      ? 'bg-zinc-800 text-white shadow-[0_1px_3px_rgba(0,0,0,0.4)] border border-white/5'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent'}
                  `}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="ml-auto pr-3">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="group flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-600 hover:text-red-500 transition-colors disabled:opacity-30"
            >
              <span className={`w-1.5 h-1.5 rounded-full bg-current ${deleting ? 'animate-pulse' : 'opacity-40'}`} />
              {deleting ? 'Deleting' : 'Delete'}
            </button>
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="min-h-[500px] animate-in fade-in slide-in-from-bottom-2 duration-500">
          {activeTab === 'money' && <MoneyTab tabs={idea.tabs} idea={idea} />}
          {activeTab === 'plan' && <PlanTab tabs={idea.tabs} idea={idea} />}
          {activeTab === 'problems' && <ProblemsTab tabs={idea.tabs} idea={idea} />}
          {activeTab === 'chat' && <ChatTab idea={idea} />}
          {activeTab === 'people' && <PeopleTab tabs={idea.tabs} idea={idea} />}
        </div>
      </div>
    </div>
  );
}
function LoadingSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="skel h-4 rounded w-1/3" />
            <div className="skel h-3 rounded w-2/3" />
          </div>
          <div className="skel w-16 h-8 rounded-full" />
        </div>
        <div className="flex gap-2 border-b border-white/5 pb-2">
          {[60, 45, 70, 40, 55].map((w, i) => (
            <div key={i} className="skel h-6 rounded-lg" style={{ width: `${w}px` }} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-px bg-white/5 rounded-xl overflow-hidden border border-white/5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-zinc-950 p-4 space-y-2">
              <div className="skel h-2.5 rounded w-1/2" />
              <div className="skel h-5 rounded w-3/4" />
              <div className="skel h-2 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
