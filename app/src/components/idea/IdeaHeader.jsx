export default function IdeaHeader({ idea }) {
    if (!idea) return null

    function viabilityColor(score) {
        if (score >= 8) return '#c8ff00'
        if (score >= 6) return '#facc15'
        if (score >= 4) return '#f97316'
        return '#ef4444'
    }

    const color = viabilityColor(idea.viability_score)

    return (
        <div className="mb-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-zinc-100">{idea.title}</h1>
                    <p className="text-sm text-zinc-500 mt-2 leading-relaxed max-w-2xl">
                        {idea.description || idea.summary}
                    </p>
                </div>
                <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-mono text-lg font-medium flex-shrink-0 border"
                    style={{ borderColor: color + '55', color, background: color + '10' }}
                >
                    {idea.viability_score}
                </div>
            </div>
        </div>
    )
}