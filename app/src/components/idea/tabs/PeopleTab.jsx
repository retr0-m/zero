function viabilityColor(score) {
  if (score >= 8) return '#c8ff00'
  if (score >= 6) return '#facc15'
  if (score >= 4) return '#f97316'
  return '#ef4444'
}

const ROLE_ICONS = {
  default: '👤',
  developer: '💻',
  designer: '🎨',
  marketer: '📢',
  sales: '🤝',
  lawyer: '⚖️',
  accountant: '📊',
  mentor: '🧭',
  investor: '💰',
}

function roleIcon(role) {
  const r = role.toLowerCase()
  if (r.includes('dev') || r.includes('engineer') || r.includes('tech')) return ROLE_ICONS.developer
  if (r.includes('design') || r.includes('ux') || r.includes('ui')) return ROLE_ICONS.designer
  if (r.includes('market') || r.includes('growth') || r.includes('seo')) return ROLE_ICONS.marketer
  if (r.includes('sales') || r.includes('biz dev')) return ROLE_ICONS.sales
  if (r.includes('law') || r.includes('legal') || r.includes('compliance')) return ROLE_ICONS.lawyer
  if (r.includes('account') || r.includes('cfo') || r.includes('finance')) return ROLE_ICONS.accountant
  if (r.includes('mentor') || r.includes('advisor')) return ROLE_ICONS.mentor
  if (r.includes('invest') || r.includes('vc') || r.includes('angel')) return ROLE_ICONS.investor
  return ROLE_ICONS.default
}

export default function PeopleTab({ tabs, idea }) {
  const people = tabs?.people?.contacts_needed
  if (!people?.length) return <Empty />

  const color = viabilityColor(idea.viability_score)

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-600 leading-relaxed">
        {people.length} role{people.length !== 1 ? 's' : ''} identified for this venture.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {people.map((p, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/5 bg-zinc-950 p-4 hover:border-white/10 transition-all group"
          >
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                style={{ background: color + '10', border: `1px solid ${color}20` }}
              >
                {roleIcon(p.role)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-zinc-200 leading-tight">{p.role}</div>
                <div className="text-[11px] text-zinc-500 mt-1 leading-relaxed">{p.why}</div>
              </div>
            </div>
            <div
              className="mt-3 pt-3 border-t border-white/5 flex items-center gap-1.5"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1" style={{ color: color + '80' }} />
                <path d="M5 3v2.5l1.5 1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" style={{ color: color + '80' }} />
              </svg>
              <span className="font-mono text-[11px]" style={{ color }}>
                {p.where}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Empty() {
  return <p className="text-xs text-zinc-600 font-mono">No people data available.</p>
}
