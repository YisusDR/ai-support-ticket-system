import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard — AI Support',
}

export default async function CustomerDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'customer') redirect('/agent')

  // Fetch all tickets for metrics
  const { data: allTickets } = await supabase
    .from('tickets')
    .select('id, status, priority, title, created_at')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  const tickets = allTickets ?? []
  const metrics = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    in_progress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
  }

  const recentTickets = tickets.slice(0, 3)
  const firstName = profile.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="flex flex-col min-h-full">
      <Navbar
        title="Dashboard"
        subtitle={`Welcome back, ${firstName} 👋`}
        actions={
          <Link
            href="/tickets"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            My Tickets
          </Link>
        }
      />

      <div className="flex-1 p-6 space-y-8 animate-fade-in">
        {/* ── Metrics ── */}
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Overview
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Total Tickets',
                value: metrics.total,
                icon: '🎫',
                gradient: 'from-slate-800/80 to-slate-800/40',
                border: 'border-slate-700/50',
                valueColor: 'text-slate-100',
              },
              {
                label: 'Open',
                value: metrics.open,
                icon: '📬',
                gradient: 'from-blue-500/10 to-blue-600/5',
                border: 'border-blue-500/20',
                valueColor: 'text-blue-400',
              },
              {
                label: 'In Progress',
                value: metrics.in_progress,
                icon: '⚡',
                gradient: 'from-amber-500/10 to-amber-600/5',
                border: 'border-amber-500/20',
                valueColor: 'text-amber-400',
              },
              {
                label: 'Resolved',
                value: metrics.resolved,
                icon: '✅',
                gradient: 'from-emerald-500/10 to-emerald-600/5',
                border: 'border-emerald-500/20',
                valueColor: 'text-emerald-400',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`rounded-xl border bg-gradient-to-br p-5 backdrop-blur-sm ${stat.gradient} ${stat.border}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <span className="text-lg">{stat.icon}</span>
                </div>
                <p className={`text-3xl font-bold ${stat.valueColor}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Recent Tickets ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Recent Tickets
            </h2>
            <Link
              href="/tickets"
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium flex items-center gap-1"
            >
              View all
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {recentTickets.length === 0 ? (
            <Card variant="elevated" className="text-center py-12">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-300 mb-1">No tickets yet</p>
              <p className="text-xs text-slate-500 mb-4">Create your first ticket to get started.</p>
              <Link
                href="/tickets"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
              >
                + New Ticket
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentTickets.map((ticket) => (
                <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                  <div className="glass-card p-4 flex items-center gap-4 hover:border-indigo-500/30 hover:bg-slate-800/80 transition-all duration-150 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 group-hover:text-indigo-300 transition-colors truncate">
                        {ticket.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(ticket.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={ticket.status} />
                      <svg className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
