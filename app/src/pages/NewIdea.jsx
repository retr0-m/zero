import { useState, useRef, useEffect } from 'react'
import { quickRead, fullAnalysis, saveIdea } from '../api/client'
import { useLocation } from 'react-router-dom'

function viabilityColor(score) {
  if (score >= 8) return '#c8ff00'
  if (score >= 6) return '#facc15'
  if (score >= 4) return '#f97316'
  return '#ef4444'
}

const BUDGET_OPTIONS = ['< EUR 1k', 'EUR 1–5k', 'EUR 5–20k', 'EUR 20k+']
const HOURS_OPTIONS = ['< 1h / day', '1–2h / day', '3–5h / day', 'Full-time']

// ─── Step 0: Idea input ────────────────────────────────────────────────────
function IdeaInput({ onSubmit, loading, defaultValue }) {
  const [text, setText] = useState(defaultValue || '')
  const MIN = 20
  const MAX = 2000

  function handleSubmit(e) {
    e.preventDefault()
    if (text.trim().length >= MIN) onSubmit(text.trim())
  }

  return (
    <div className="max-w-xl mx-auto w-full">
      <h2 className="text-sm font-medium text-zinc-300 mb-1">Describe your idea</h2>
      <p className="text-xs text-zinc-600 mb-4 leading-relaxed">
        Be as specific as you can — what it is, who it's for, how it makes money.
      </p>
      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX))}
          rows={6}
          placeholder="e.g. A subscription platform for local restaurants to send weekly meal kit boxes to their regular customers…"
          className="w-full bg-zinc-900/60 border border-white/6 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-[#c8ff00]/40 focus:ring-1 focus:ring-[#c8ff00]/15 resize-none transition-all leading-relaxed"
        />
        <div className="flex items-center justify-between mt-2">
          <span className={`text-xs font-mono ${text.length < MIN ? 'text-zinc-600' : 'text-zinc-500'}`}>
            {text.length} / {MAX}
          </span>
          <button
            type="submit"
            disabled={loading || text.trim().length < MIN}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
            style={{ background: '#c8ff00', color: '#0a0a0a' }}
          >
            {loading ? (
              <>
                <span className="w-3 h-3 border border-black/30 border-t-black rounded-full animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                Quick read
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Step 1: Quick read result + questions ─────────────────────────────────
function QuickReadStep({ quickResult, idea, onSubmit, loading }) {
  const [hours, setHours] = useState('')
  const [budget, setBudget] = useState('')
  const [answers, setAnswers] = useState({})
  const color = viabilityColor(quickResult.viability_score)

  function canSubmit() {
    if (!hours || !budget) return false
    return quickResult.questions.every((q) => answers[q.id]?.trim())
  }

  function handleSubmit() {
    onSubmit({ hours_per_day: hours, budget, answers })
  }

  return (
    <div className="max-w-xl mx-auto w-full space-y-5">
      {/* quick read card */}
      <div className="rounded-xl border border-white/6 bg-zinc-900/60 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-zinc-100">{quickResult.title}</h2>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{quickResult.summary}</p>
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-mono text-sm font-medium flex-shrink-0 border"
            style={{ borderColor: color + '55', color, background: color + '10' }}
          >
            {quickResult.viability_score}
          </div>
        </div>
      </div>

      {/* fixed questions */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-mono text-zinc-500 mb-2">
            How many hours per day can you work on this?
          </label>
          <div className="flex flex-wrap gap-2">
            {HOURS_OPTIONS.map((o) => (
              <button
                key={o}
                onClick={() => setHours(o)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                  hours === o
                    ? 'border-[#c8ff00]/50 bg-[#c8ff00]/10 text-[#c8ff00]'
                    : 'border-white/8 text-zinc-500 hover:text-zinc-300 hover:border-white/15'
                }`}
              >
                {o}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono text-zinc-500 mb-2">
            What's your available budget?
          </label>
          <div className="flex flex-wrap gap-2">
            {BUDGET_OPTIONS.map((o) => (
              <button
                key={o}
                onClick={() => setBudget(o)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                  budget === o
                    ? 'border-[#c8ff00]/50 bg-[#c8ff00]/10 text-[#c8ff00]'
                    : 'border-white/8 text-zinc-500 hover:text-zinc-300 hover:border-white/15'
                }`}
              >
                {o}
              </button>
            ))}
          </div>
        </div>

        {/* dynamic questions */}
        {quickResult.questions.map((q) => (
          <div key={q.id}>
            <label className="block text-xs font-mono text-zinc-500 mb-2">{q.text}</label>
            {q.type === 'choice' ? (
              <div className="flex flex-wrap gap-2">
                {q.choices?.map((c) => (
                  <button
                    key={c}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: c }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                      answers[q.id] === c
                        ? 'border-[#c8ff00]/50 bg-[#c8ff00]/10 text-[#c8ff00]'
                        : 'border-white/8 text-zinc-500 hover:text-zinc-300 hover:border-white/15'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            ) : (
              <input
                type="text"
                value={answers[q.id] || ''}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                placeholder="Your answer…"
                className="w-full bg-zinc-900/60 border border-white/6 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-[#c8ff00]/40 transition-all"
              />
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!canSubmit() || loading}
        className="w-full py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40 flex items-center justify-center gap-2"
        style={{ background: '#c8ff00', color: '#0a0a0a' }}
      >
        {loading ? (
          <>
            <span className="w-3 h-3 border border-black/30 border-t-black rounded-full animate-spin" />
            Building full plan…
          </>
        ) : (
          'Generate full plan →'
        )}
      </button>
    </div>
  )
}

// ─── Step 2: Full result + save ────────────────────────────────────────────
function fmt(n, currency = 'EUR') {
  return `${currency} ${new Intl.NumberFormat('de-CH').format(Math.round(n))}`
}

function ResultStep({ result, idea, onSave, saving }) {
  const color = viabilityColor(result.viability_score)
  const money = result

  return (
    <div className="max-w-2xl mx-auto w-full space-y-4 pb-8">
      {/* header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">{result.title}</h2>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed max-w-lg">{result.summary}</p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border flex-shrink-0"
          style={{ borderColor: color + '40', background: color + '10' }}
        >
          <span className="font-mono text-sm font-medium" style={{ color }}>
            {result.viability_score}/10
          </span>
        </div>
      </div>

      {/* money metrics */}
      <div className="grid grid-cols-3 gap-px bg-white/5 rounded-xl overflow-hidden border border-white/5">
        {[
          { label: 'Investment', value: `${fmt(result.investment.min)}–${new Intl.NumberFormat('de-CH').format(result.investment.max)}`, sub: result.investment.breakdown },
          { label: 'Revenue / 12mo', value: `${fmt(result.revenue.month_12)}/mo`, sub: `6mo: ${fmt(result.revenue.month_6)} · 3mo: ${fmt(result.revenue.month_3)}`, accent: true },
          { label: 'Break-even', value: result.timeline.break_even, sub: `1st customer: ${result.timeline.first_customer}` },
        ].map(({ label, value, sub, accent }) => (
          <div key={label} className="bg-zinc-950 p-3">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">{label}</div>
            <div className="font-mono text-sm font-medium" style={{ color: accent ? color : '#e4e4e7' }}>{value}</div>
            <div className="text-[11px] text-zinc-600 mt-1 leading-relaxed">{sub}</div>
          </div>
        ))}
      </div>

      {/* plan + roadmap */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/5 rounded-xl overflow-hidden border border-white/5">
        <div className="bg-zinc-950 p-4">
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-3">Business plan</div>
          <ol className="space-y-2.5">
            {result.business_plan.map((step, i) => (
              <li key={i} className="flex gap-2.5 items-start">
                <span className="font-mono text-[10px] text-zinc-600 pt-0.5 flex-shrink-0">0{i + 1}</span>
                <span className="text-xs text-zinc-400 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="bg-zinc-950 p-4">
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-3">Roadmap</div>
          <div className="space-y-3 relative">
            <div className="absolute left-[4px] top-1 bottom-1 w-px bg-white/6" />
            {result.roadmap.map((r, i) => (
              <div key={i} className="flex gap-3 items-start pl-5 relative">
                <span className="absolute left-0 top-1.5 w-2 h-2 rounded-full border flex-shrink-0" style={{ borderColor: color + '80', background: color + '20' }} />
                <div>
                  <span className="font-mono text-[10px] block mb-0.5" style={{ color }}>{r.when}</span>
                  <span className="text-xs text-zinc-400 leading-relaxed">{r.milestone}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* problems preview */}
      <div className="rounded-xl border border-white/5 bg-zinc-950 p-4">
        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-3">Key risks</div>
        <div className="space-y-2">
          {result.problems?.slice(0, 3).map((p, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-orange-400 mt-0.5 flex-shrink-0 text-xs">⚠</span>
              <div>
                <span className="text-xs font-medium text-zinc-300">{p.title}</span>
                <span className="text-xs text-zinc-600 ml-1.5">{p.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* people */}
      <div className="rounded-xl border border-white/5 bg-zinc-950 p-4">
        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-3">Who you need</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {result.contacts_needed.map((c, i) => (
            <div key={i} className="rounded-lg border border-white/5 bg-zinc-900/50 p-3">
              <div className="text-xs font-medium text-zinc-200 mb-0.5">{c.role}</div>
              <div className="text-[11px] text-zinc-500 leading-relaxed mb-1.5">{c.why}</div>
              <div className="font-mono text-[11px]" style={{ color }}>{c.where}</div>
            </div>
          ))}
        </div>
      </div>

      {/* save CTA */}
      <div className="flex items-center justify-center pt-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
          style={{ background: '#c8ff00', color: '#0a0a0a' }}
        >
          {saving ? (
            <>
              <span className="w-3 h-3 border border-black/30 border-t-black rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            <>
              Save to my ideas
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Main NewIdea page ─────────────────────────────────────────────────────
export default function NewIdea({ onSaved }) {
  const location = useLocation()
  const pendingIdea = location.state?.pendingIdea || null

  const [step, setStep] = useState(0) // 0: input, 1: questions, 2: result
  const [idea, setIdea] = useState(pendingIdea || '')
  const [quickResult, setQuickResult] = useState(null)
  const [fullResult, setFullResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const topRef = useRef(null)

  // auto-trigger quick read if coming from landing with pre-filled idea
  useEffect(() => {
    if (pendingIdea && step === 0) {
      handleQuickRead(pendingIdea)
    }
  }, [])

  function scrollTop() {
    topRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function handleQuickRead(text) {
    setError('')
    setLoading(true)
    setIdea(text)
    try {
      const { data } = await quickRead(text)
      setQuickResult(data)
      setStep(1)
      scrollTop()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze idea. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  async function handleFullAnalysis({ hours_per_day, budget, answers }) {
    setError('')
    setLoading(true)
    try {
      const { data } = await fullAnalysis({ idea, hours_per_day, budget, answers })
      setFullResult(data)
      setStep(2)
      scrollTop()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate full plan.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { data } = await saveIdea(idea, fullResult)
      onSaved?.(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save idea.')
      setSaving(false)
    }
  }

  // step labels for breadcrumb
  const steps = ['Describe', 'Refine', 'Review']

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-8" ref={topRef}>
        {/* breadcrumb */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] font-mono transition-all ${
                    i < step
                      ? 'bg-[#c8ff00] border-[#c8ff00] text-black'
                      : i === step
                      ? 'border-[#c8ff00]/60 text-[#c8ff00]'
                      : 'border-white/10 text-zinc-600'
                  }`}
                >
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-mono ${i === step ? 'text-zinc-300' : 'text-zinc-600'}`}>{s}</span>
              </div>
              {i < steps.length - 1 && <div className="w-6 h-px bg-white/8" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-xs text-red-400 font-mono">
            {error}
          </div>
        )}

        {step === 0 && (
          <IdeaInput onSubmit={handleQuickRead} loading={loading} defaultValue={pendingIdea} />
        )}
        {step === 1 && quickResult && (
          <QuickReadStep
            quickResult={quickResult}
            idea={idea}
            onSubmit={handleFullAnalysis}
            loading={loading}
          />
        )}
        {step === 2 && fullResult && (
          <ResultStep
            result={fullResult}
            idea={idea}
            onSave={handleSave}
            saving={saving}
          />
        )}
      </div>
    </div>
  )
}
