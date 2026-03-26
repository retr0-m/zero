function viabilityColor(score) {
  if (score >= 8) return '#c8ff00'
  if (score >= 6) return '#facc15'
  if (score >= 4) return '#f97316'
  return '#ef4444'
}

function fmt(n, currency = 'EUR') {
  return `${currency} ${new Intl.NumberFormat('de-CH').format(Math.round(n))}`
}

// Simple bar chart using divs
function RevenueChart({ revenue, color }) {
  const max = revenue.month_12
  const bars = [
    { label: '3mo', value: revenue.month_3 },
    { label: '6mo', value: revenue.month_6 },
    { label: '12mo', value: revenue.month_12 },
  ]

  return (
    <div className="flex items-end gap-3 h-20">
      {bars.map(({ label, value }) => {
        const pct = max > 0 ? Math.max((value / max) * 100, 4) : 4
        return (
          <div key={label} className="flex-1 flex flex-col items-center gap-1">
            <span className="font-mono text-[10px] text-zinc-500">
              {fmt(value, '')}
            </span>
            <div className="w-full rounded-t-md transition-all" style={{ height: `${pct * 0.6}px`, background: color + (value === 0 ? '20' : '60') }} />
            <span className="font-mono text-[10px] text-zinc-600">{label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function MoneyTab({ tabs, idea }) {
  const money = tabs?.money
  if (!money) return <Empty />

  const { investment, revenue, timeline } = money
  const color = viabilityColor(idea.viability_score)

  return (
    <div className="space-y-3">
      {/* 3 metrics */}
      <div className="grid grid-cols-3 gap-px bg-white/5 rounded-xl overflow-hidden border border-white/5">
        <div className="bg-zinc-950 p-4">
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">Investment</div>
          <div className="font-mono text-sm font-medium text-zinc-100">
            {fmt(investment.min)}–{new Intl.NumberFormat('de-CH').format(investment.max)}
          </div>
          <div className="text-[11px] text-zinc-600 mt-1.5 leading-relaxed">{investment.breakdown}</div>
        </div>

        <div className="bg-zinc-950 p-4">
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">Revenue / 12mo</div>
          <div className="font-mono text-sm font-medium" style={{ color }}>
            {fmt(revenue.month_12, revenue.currency)}/mo
          </div>
          <div className="text-[11px] text-zinc-600 mt-1.5">
            6mo: {fmt(revenue.month_6)} · 3mo: {fmt(revenue.month_3)}
          </div>
        </div>

        <div className="bg-zinc-950 p-4">
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">Break-even</div>
          <div className="font-mono text-sm font-medium text-zinc-100">{timeline.break_even}</div>
          <div className="text-[11px] text-zinc-600 mt-1.5">
            1st customer: {timeline.first_customer}
          </div>
          {timeline.amortize && (
            <div className="text-[11px] text-zinc-700 mt-0.5">
              Full ROI: {timeline.amortize}
            </div>
          )}
        </div>
      </div>

      {/* revenue chart */}
      <div className="rounded-xl border border-white/5 bg-zinc-950 p-4">
        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-4">Revenue trajectory</div>
        <RevenueChart revenue={revenue} color={color} />
      </div>

      {/* first customers */}
      <div className="rounded-xl border border-white/5 bg-zinc-950 p-4">
        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">First customer milestone</div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Expected within <span className="font-mono" style={{ color }}>{timeline.first_customer}</span> of launch.
          Break-even projected at <span className="font-mono" style={{ color }}>{timeline.break_even}</span>.
        </p>
      </div>
    </div>
  )
}

function Empty() {
  return <p className="text-xs text-zinc-600 font-mono">No financial data available.</p>
}
