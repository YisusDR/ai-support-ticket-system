import { Card } from '@/components/ui/Card'

interface AISummaryCardProps {
  aiSummary: string | null
  aiSuggestions: string | null
}

export function AISummaryCard({ aiSummary, aiSuggestions }: AISummaryCardProps) {
  const hasSummary = !!aiSummary?.trim()
  const hasSuggestions = !!aiSuggestions?.trim()
  const hasAnyData = hasSummary || hasSuggestions

  return (
    <Card variant="ai" className="animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-5 h-5 text-indigo-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-indigo-300">AI Analysis</h3>
          <p className="text-xs text-slate-500">Automatically generated insights</p>
        </div>

        {/* Status pill */}
        {hasAnyData ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Ready
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Analyzing…
          </span>
        )}
      </div>

      {/* ── Pending state ── */}
      {!hasAnyData && (
        <div className="flex items-center gap-3 py-5 px-1">
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
          </div>
          <p className="text-sm text-slate-400">
            The AI is processing this ticket. Results will appear here automatically.
          </p>
        </div>
      )}

      {/* ── Data state ── */}
      {hasAnyData && (
        <div className="space-y-5">
          {/* Summary block */}
          {hasSummary ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-md bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
                  <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  Summary
                </h4>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed bg-blue-500/5 border border-blue-500/10 rounded-lg px-4 py-3 whitespace-pre-wrap">
                {aiSummary}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-500 italic">
              <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Summary not yet available
            </div>
          )}

          {/* Suggested response block */}
          {hasSuggestions ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-md bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
                  <svg className="w-3 h-3 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
                  Suggested Response
                </h4>
              </div>
              <div className="text-sm text-slate-300 leading-relaxed bg-violet-500/5 border border-violet-500/10 rounded-lg px-4 py-3 whitespace-pre-wrap">
                {aiSuggestions}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-500 italic">
              <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Suggested response not yet available
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
