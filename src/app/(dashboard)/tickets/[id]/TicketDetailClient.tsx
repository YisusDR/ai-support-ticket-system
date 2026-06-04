'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CommentThread } from '@/components/tickets/CommentThread'
import { TicketStatusButton } from '@/components/tickets/TicketStatusButton'
import { AISummaryCard } from '@/components/tickets/AISummaryCard'
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { PageSpinner } from '@/components/ui/Spinner'
import Link from 'next/link'
import type { Ticket, Profile } from '@/lib/types'

interface TicketDetailClientProps {
  ticketId: string
  currentUser: { id: string; profile: Profile }
}

export function TicketDetailClient({ ticketId, currentUser }: TicketDetailClientProps) {
  const supabase = createClient()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTicket = async () => {
    const { data, error: fetchError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single()

    if (fetchError) setError(fetchError.message)
    else setTicket(data)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchTicket()

    // Live updates — catches AI filling in ai_summary / ai_suggestions
    const channel = supabase
      .channel(`ticket-detail-${ticketId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `id=eq.${ticketId}` },
        (payload) => setTicket(payload.new as Ticket)
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId])

  if (isLoading) return <PageSpinner />

  if (error || !ticket) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
          </svg>
          {error ?? 'Ticket not found'}
        </div>
      </div>
    )
  }

  const backHref = currentUser.profile.role === 'customer' ? '/tickets' : '/tickets'

  return (
    <div className="flex-1 p-6 animate-slide-up">
      {/* Back link */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Tickets
      </Link>

      {/* ── Two-column layout ── */}
      <div className="flex gap-6 items-start">

        {/* ════════════════════════════════
            LEFT COLUMN — 70% — Main content
            ════════════════════════════════ */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* Ticket header card */}
          <Card variant="elevated">
            <div className="mb-5">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
                <span className="text-xs text-slate-600 font-mono">
                  #{ticket.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <h1 className="text-xl font-semibold text-slate-100 leading-snug">
                {ticket.title}
              </h1>
            </div>

            <div className="border-t border-slate-700/50 pt-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Description
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>

            {/* Metadata row */}
            <div className="border-t border-slate-700/50 mt-5 pt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
              <span>
                Submitted{' '}
                <span className="text-slate-400">
                  {new Date(ticket.created_at).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric',
                  })}
                </span>
              </span>
              {ticket.updated_at && (
                <span>
                  Last updated{' '}
                  <span className="text-slate-400">
                    {new Date(ticket.updated_at).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric',
                    })}
                  </span>
                </span>
              )}
            </div>
          </Card>

          {/* Comment thread card */}
          <Card variant="elevated">
            <CommentThread
              ticketId={ticket.id}
              currentUserId={currentUser.id}
              currentUserName={currentUser.profile.full_name}
            />
          </Card>
        </div>

        {/* ════════════════════════════════
            RIGHT COLUMN — 30% — Sidebar
            ════════════════════════════════ */}
        <aside className="w-80 flex-shrink-0 space-y-4 sticky top-20">

          {/* Status & actions card */}
          <Card variant="elevated" className="!p-0 overflow-hidden">
            {/* Status header strip */}
            <div className={`px-5 py-3 border-b border-slate-700/50 flex items-center justify-between ${
              ticket.status === 'resolved'
                ? 'bg-emerald-500/10'
                : ticket.status === 'in_progress'
                ? 'bg-amber-500/10'
                : 'bg-blue-500/10'
            }`}>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Status
              </span>
              <StatusBadge status={ticket.status} />
            </div>
            <div className="p-5 space-y-4">
              {/* Priority */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Priority</span>
                <PriorityBadge priority={ticket.priority} />
              </div>

              {/* Ticket ID */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Ticket ID</span>
                <span className="text-xs font-mono text-slate-400">
                  #{ticket.id.slice(0, 8).toUpperCase()}
                </span>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-700/50" />

              {/* Resolve button */}
              <TicketStatusButton
                ticketId={ticket.id}
                currentStatus={ticket.status}
                userRole={currentUser.profile.role}
                onResolved={fetchTicket}
              />
            </div>
          </Card>

          {/* AI Analysis card */}
          <AISummaryCard
            aiSummary={ticket.ai_summary}
            aiSuggestions={ticket.ai_suggestions}
          />
        </aside>
      </div>
    </div>
  )
}
