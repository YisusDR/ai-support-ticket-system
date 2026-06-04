'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSpinner } from '@/components/ui/Spinner'
import type { Ticket } from '@/lib/types'

interface TicketTableProps {
  /** If provided, filter tickets by customer_id */
  customerId?: string
  /** Show priority column (agent view) */
  showPriority?: boolean
  /** Make rows clickable — navigates to /tickets/[id] */
  clickable?: boolean
}

export function TicketTable({
  customerId,
  showPriority = false,
  clickable = false,
}: TicketTableProps) {
  const supabase = createClient()
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTickets = async () => {
    let query

    if (customerId) {
      query = supabase
        .from('tickets')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
    } else {
      // Agent view: high → medium → low, then newest first
      query = supabase
        .from('tickets')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
    }

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setTickets(data ?? [])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchTickets()

    const channel = supabase
      .channel('tickets-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          ...(customerId ? { filter: `customer_id=eq.${customerId}` } : {}),
        },
        () => fetchTickets()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId])

  if (isLoading) return <PageSpinner />

  if (error) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Error: {error}
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        }
        title="No tickets yet"
        description={
          customerId
            ? "You haven't submitted any support tickets yet."
            : 'No tickets in the system yet.'
        }
      />
    )
  }

  const handleRowClick = (id: string) => {
    if (clickable) {
      router.push(`/tickets/${id}`)
    }
  }

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/50 bg-slate-800/60">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Ticket
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Status
            </th>
            {showPriority && (
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Priority
              </th>
            )}
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
              Created
            </th>
            {clickable && (
              <th className="px-4 py-3 w-10" aria-label="Open ticket" />
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/30">
          {tickets.map((ticket) => (
            <tr
              key={ticket.id}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
              onClick={() => handleRowClick(ticket.id)}
              onKeyDown={(e) => {
                if (clickable && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  handleRowClick(ticket.id)
                }
              }}
              style={clickable ? { cursor: 'pointer' } : undefined}
              className={[
                'group transition-colors duration-150',
                clickable
                  ? 'hover:bg-indigo-500/5 focus:outline-none focus:bg-indigo-500/5'
                  : 'hover:bg-slate-800/30',
              ].join(' ')}
            >
              {/* Title + description */}
              <td className="px-4 py-3.5">
                <div className="flex flex-col gap-0.5">
                  <span
                    className={[
                      'font-medium text-slate-200 line-clamp-1 transition-colors',
                      clickable ? 'group-hover:text-indigo-300' : '',
                    ].join(' ')}
                  >
                    {ticket.title}
                  </span>
                  <span className="text-xs text-slate-500 line-clamp-1">
                    {ticket.description}
                  </span>
                </div>
              </td>

              {/* Status */}
              <td className="px-4 py-3.5">
                <StatusBadge status={ticket.status} />
              </td>

              {/* Priority (agent view only) */}
              {showPriority && (
                <td className="px-4 py-3.5">
                  <PriorityBadge priority={ticket.priority} />
                </td>
              )}

              {/* Date */}
              <td className="px-4 py-3.5 text-xs text-slate-500 hidden md:table-cell whitespace-nowrap">
                {new Date(ticket.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </td>

              {/* Arrow icon for clickable rows */}
              {clickable && (
                <td className="px-4 py-3.5 text-slate-600 group-hover:text-indigo-400 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
