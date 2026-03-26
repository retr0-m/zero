function viabilityColor(score) {
  if (score >= 8) return '#c8ff00'
  if (score >= 6) return '#facc15'
  if (score >= 4) return '#f97316'
  return '#ef4444'
}

export default function PlanTab({ tabs, idea }) {
  const plan = tabs?.plan
  if (!plan) return <Empty />

  const { business_plan, roadmap } = plan
  const color = viabilityColor(idea.viability_score)

  return (
    <div className="space-y-3">
      {/* business plan */}
      <div className="rounded-xl border border-white/5 bg-zinc-950 p-5">
        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-4">Business plan</div>
        <ol className="space-y-4">
          {business_plan.map((step, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span
                className="font-mono text-xs pt-0.5 flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-[10px]"
                style={{ background: color + '15', color }}
              >
                {i + 1}
              </span>
              <span className="text-xs text-zinc-300 leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* roadmap timeline */}
      <div className="rounded-xl border border-white/5 bg-zinc-950 p-5">
        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-4">Roadmap</div>
        <div className="relative space-y-4">
          {/* vertical line */}
          <div
            className="absolute left-[7px] top-2 bottom-2 w-px"
            style={{ background: `linear-gradient(to bottom, ${color}60, ${color}10)` }}
          />
          {roadmap.map((r, i) => (
            <div key={i} className="flex gap-4 items-start pl-6 relative">
              <span
                className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 flex-shrink-0"
                style={{ borderColor: color, background: i === 0 ? color : '#0a0a0a' }}
              />
              <div className="min-w-0">
                <span
                  className="font-mono text-[10px] block mb-0.5 uppercase tracking-wider"
                  style={{ color }}
                >
                  {r.when}
                </span>
                <span className="text-xs text-zinc-300 leading-relaxed">{r.milestone}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Empty() {
  return <p className="text-xs text-zinc-600 font-mono">No plan data available.</p>
}
