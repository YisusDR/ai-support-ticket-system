'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSpinner } from '@/components/ui/Spinner'
import { NewTicketModal } from '@/components/tickets/NewTicketModal'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import type { Ticket, Profile } from '@/lib/types'

interface TicketsPageClientProps {
  currentUser: { id: string; profile: Profile }
}

export function TicketsPageClient({ currentUser }: TicketsPageClientProps) {
  const supabase = createClient()
  const router = useRouter()
  const isCustomer = currentUser.profile.role === 'customer'

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchTickets = useCallback(async () => {
    let query = supabase
      .from('tickets')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (isCustomer) {
      query = query.eq('customer_id', currentUser.id)
    }

    const { data, error: fetchError } = await query
    if (fetchError) {
      setError(fetchError.message)
    } else {
      setTickets(data ?? [])
    }
    setIsLoading(false)
  }, [isCustomer, currentUser.id, supabase])

  useEffect(() => {
    fetchTickets()

    const channel = supabase
      .channel('tickets-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          ...(isCustomer ? { filter: `customer_id=eq.${currentUser.id}` } : {}),
        },
        () => fetchTickets()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchTickets, isCustomer, currentUser.id, supabase])

  const newTicketButton = (
    <Button
      variant="primary"
      onClick={() => setModalOpen(true)}
      leftIcon={
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      }
    >
      New Ticket
    </Button>
  )

  return (
    <>
      <Navbar
        title={isCustomer ? 'My Tickets' : 'All Tickets'}
        subtitle={
          isCustomer
            ? 'Track and manage your support requests'
            : 'All tickets sorted by AI-assigned priority'
        }
        actions={
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50 border border-slate-700/50 px-3 py-1.5 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </div>
            {isCustomer && newTicketButton}
          </div>
        }
      />

      <div className="flex-1 p-6 animate-fade-in">
        {isLoading ? (
          <PageSpinner />
        ) : error ? (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            title="No tickets yet"
            description={
              isCustomer
                ? "You haven't submitted any tickets yet."
                : 'No tickets in the system yet.'
            }
            action={isCustomer ? newTicketButton : undefined}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/60">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                    Created
                  </th>
                  <th className="px-4 py-3.5 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => router.push(`/tickets/${ticket.id}`)}
                    tabIndex={0}
                    role="button"
                    style={{ cursor: 'pointer' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        router.push(`/tickets/${ticket.id}`)
                      }
                    }}
                    className="group transition-colors duration-150 hover:bg-indigo-500/5 focus:outline-none focus:bg-indigo-500/5"
                  >
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-slate-200 group-hover:text-indigo-300 transition-colors line-clamp-1">
                          {ticket.title}
                        </span>
                        <span className="text-xs text-slate-500 line-clamp-1">
                          {ticket.description}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-4 py-4">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500 hidden lg:table-cell whitespace-nowrap">
                      {new Date(ticket.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-4 text-slate-600 group-hover:text-indigo-400 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer count */}
            <div className="px-5 py-3 border-t border-slate-700/30 bg-slate-800/30">
              <p className="text-xs text-slate-500">
                {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} total
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isCustomer && (
        <NewTicketModal
          userId={currentUser.id}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            setModalOpen(false)
            fetchTickets()
          }}
        />
      )}
    </>
  )
}
