import { useState } from 'react'

export default function ProblemsTab({ tabs, idea }) {
  const problems = tabs?.problems?.problems
  const [expanded, setExpanded] = useState(null)

  if (!problems?.length) return <Empty />

  function toggle(i) {
    setExpanded((prev) => (prev === i ? null : i))
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-600 leading-relaxed mb-4">
        {problems.length} potential risks identified for this business model.
      </p>

      {problems.map((p, i) => (
        <div
          key={i}
          className="rounded-xl border bg-zinc-950 overflow-hidden transition-all"
          style={{ borderColor: expanded === i ? 'rgba(249,115,22,0.3)' : 'rgba(255,255,255,0.05)' }}
        >
          {/* header */}
          <button
            onClick={() => toggle(i)}
            className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/2 transition-colors"
          >
            <span className="text-orange-400 flex-shrink-0 mt-0.5 text-sm">⚠</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-zinc-200">{p.title}</div>
              <div className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed line-clamp-1">
                {p.description}
              </div>
            </div>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className={`flex-shrink-0 mt-0.5 text-zinc-600 transition-transform duration-200 ${
                expanded === i ? 'rotate-180' : ''
              }`}
            >
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* expanded */}
          {expanded === i && (
            <div className="px-4 pb-4 space-y-3 border-t border-white/5">
              <div>
                <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mt-3 mb-1">The risk</div>
                <p className="text-xs text-zinc-400 leading-relaxed">{p.description}</p>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: '#c8ff00cc' }}>
                  How to face it
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{p.mitigation}</p>
              </div>

              <div>
                <div className="text-[10px] font-mono text-orange-500/70 uppercase tracking-wider mb-1">
                  If this goes wrong…
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{p.contingency}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function Empty() {
  return <p className="text-xs text-zinc-600 font-mono">No risk data available.</p>
}
