import { useState, useRef, useEffect } from 'react'
import { sendChat } from '../../../api/client'

function viabilityColor(score) {
  if (score >= 8) return '#c8ff00'
  if (score >= 6) return '#facc15'
  if (score >= 4) return '#f97316'
  return '#ef4444'
}

const STARTERS = [
  'What should I do first?',
  'How do I find my first customer?',
  'What are the biggest risks here?',
  'How do I validate this without spending money?',
]

export default function ChatTab({ idea }) {
  const [messages, setMessages] = useState(idea.chat_messages || [])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const color = viabilityColor(idea.viability_score)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text) {
    const msg = text.trim()
    if (!msg || loading) return
    setInput('')
    setError('')

    const userMsg = { id: Date.now(), role: 'user', content: msg }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const { data } = await sendChat(idea.id, msg)
      setMessages((prev) => [...prev, data])
    } catch (err) {
      setError('Failed to get a response. Try again.')
      setMessages((prev) => prev.slice(0, -1)) // remove optimistic
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 260px)', minHeight: '400px' }}>
      {/* messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-3">
        {messages.length === 0 && (
          <div className="py-6 text-center space-y-4">
            <p className="text-xs text-zinc-600 leading-relaxed">
              Ask anything about your idea — strategy, pricing, marketing, execution.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="px-3 py-1.5 rounded-lg border border-white/8 text-xs text-zinc-500 hover:text-zinc-300 hover:border-white/15 transition-all font-mono"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-zinc-800 text-zinc-200 rounded-br-sm'
                  : 'bg-zinc-900 border border-white/5 text-zinc-300 rounded-bl-sm'
              }`}
            >
              {m.role === 'assistant' && (
                <span
                  className="block font-mono text-[10px] mb-1.5 uppercase tracking-wider"
                  style={{ color }}
                >
                  zeroto ai
                </span>
              )}
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 border border-white/5 rounded-xl rounded-bl-sm px-3.5 py-3">
              <span
                className="block font-mono text-[10px] mb-2 uppercase tracking-wider"
                style={{ color }}
              >
                zeroto ai
              </span>
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-bounce"
                    style={{ animationDelay: `${i * 120}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-400 font-mono text-center">{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* input */}
      <div className="pt-3 border-t border-white/5 flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder="Ask something about your idea…"
            className="flex-1 bg-zinc-900/60 border border-white/8 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-[#c8ff00]/40 resize-none transition-all leading-relaxed"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
            disabled={loading}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl transition-all disabled:opacity-30"
            style={{ background: '#c8ff00' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M7 1l-4 4M7 1l4 4" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <p className="text-[11px] text-zinc-700 mt-1.5 font-mono">↵ send · shift+↵ newline</p>
      </div>
    </div>
  )
}
