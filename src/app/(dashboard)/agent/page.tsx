import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import { ActivityChart } from '@/components/ui/ActivityChart'
import { ClickableRow } from '@/components/ui/ClickableRow'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard — AI Support',
}

// Build last-7-days activity data from ticket list
function buildActivityData(
  tickets: Array<{ created_at: string; status: string }>
) {
  const days: { label: string; date: string; created: number; resolved: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push({
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.toISOString().slice(0, 10),
      created: 0,
      resolved: 0,
    })
  }
  for (const t of tickets) {
    const day = t.created_at.slice(0, 10)
    const entry = days.find((d) => d.date === day)
    if (entry) {
      entry.created += 1
      if (t.status === 'resolved') entry.resolved += 1
    }
  }
  return days.map(({ label, created, resolved }) => ({ label, created, resolved }))
}

export default async function AgentDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role === 'customer') {
    redirect('/customer')
  }

  // Fetch all tickets with customer profile data — include AI fields from n8n
  const { data: allTickets } = await supabase
    .from('tickets')
    .select('id, title, status, priority, ai_risk_level, created_at, profiles:customer_id(id, full_name, role)')
    .order('created_at', { ascending: false })

  const tickets = allTickets ?? []

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    in_progress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
  }

  // Priority sort: tickets flagged HIGH (priority OR ai_risk_level) bubble to top
  const isHighUrgency = (t: typeof tickets[0]) =>
    t.priority === 'high' || (t.ai_risk_level as string | null)?.toLowerCase() === 'high'

  const sortedTickets = [
    ...tickets.filter(isHighUrgency),
    ...tickets.filter((t) => !isHighUrgency(t)),
  ]

  const activityData = buildActivityData(tickets)
  const recentTickets = sortedTickets.slice(0, 8)
  const firstName = profile.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="flex flex-col min-h-full bg-slate-50/40">
      <Navbar
        title={profile.role === 'admin' ? 'Admin Dashboard' : 'Agent Dashboard'}
        subtitle={`Welcome back, ${firstName} 👋`}
      />

      <div className="flex-1 p-6 space-y-6 animate-fade-in">

        {/* ── KPI Cards ── */}
        <section>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Overview</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Total Tickets',
                value: stats.total,
                icon: (
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                ),
                valueColor: 'text-slate-950',
                accent: 'bg-slate-100',
                trend: null,
              },
              {
                label: 'Open',
                value: stats.open,
                icon: (
                  <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ),
                valueColor: 'text-blue-700',
                accent: 'bg-blue-50',
                trend: null,
              },
              {
                label: 'In Progress',
                value: stats.in_progress,
                icon: (
                  <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                valueColor: 'text-amber-700',
                accent: 'bg-amber-50',
                trend: null,
              },
              {
                label: 'Resolved',
                value: stats.resolved,
                icon: (
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                valueColor: 'text-emerald-700',
                accent: 'bg-emerald-50',
                trend: null,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <div className={`w-8 h-8 rounded-lg ${stat.accent} flex items-center justify-center`}>
                    {stat.icon}
                  </div>
                </div>
                <p className={`text-3xl font-bold tracking-tight ${stat.valueColor}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Activity Chart ── */}
        <section>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-slate-950">Ticket Activity</h2>
                <p className="text-xs text-slate-400 mt-0.5">Last 7 days — created vs. resolved</p>
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-6 h-0.5 rounded-full bg-emerald-500 inline-block" />
                  Created
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-6 h-0.5 rounded-full bg-emerald-700 inline-block opacity-60 border-t-2 border-dashed border-emerald-700" />
                  Resolved
                </span>
              </div>
            </div>
            <ActivityChart data={activityData} />
          </div>
        </section>

        {/* ── Recent Tickets Table ── */}
        <section>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
              <div>
                <h2 className="text-sm font-semibold text-slate-950">Recent Tickets</h2>
                <p className="text-xs text-slate-400 mt-0.5">Latest support requests</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </div>
                <Link
                  href="/tickets"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1"
                >
                  View all
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {recentTickets.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-500">No tickets yet</p>
                <p className="text-xs text-slate-400 mt-1">Tickets will appear here once created.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/60">
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Solicitante</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asunto</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prioridad IA</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Riesgo IA</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentTickets.map((ticket) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const customerProfile = (ticket as any).profiles as { full_name: string | null } | null
                    const name = customerProfile?.full_name ?? 'Unknown'
                    const initial = name.charAt(0).toUpperCase()
                    const isUrgent = ticket.priority === 'high' || (ticket.ai_risk_level as string | null)?.toLowerCase() === 'high'
                    return (
                      <ClickableRow
                        key={ticket.id}
                        href={`/tickets/${ticket.id}`}
                        className={isUrgent ? 'bg-red-50/30 border-l-2 border-l-red-400' : ''}
                      >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-full ${isUrgent ? 'bg-red-500' : 'bg-emerald-600'} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                                {initial}
                              </div>
                              <span className="text-sm font-medium text-slate-950 truncate max-w-[120px]">
                                {name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              {isUrgent && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500 text-white uppercase tracking-wider flex-shrink-0">
                                  URGENTE
                                </span>
                              )}
                              <p className="text-sm font-medium text-slate-800 truncate max-w-[220px] group-hover:text-emerald-700 transition-colors">
                                {ticket.title}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={ticket.status} />
                          </td>
                          <td className="px-4 py-3.5">
                            {ticket.priority ? (
                              <PriorityBadge priority={ticket.priority} />
                            ) : (
                              <span className="text-xs text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            {(() => {
                              const risk = (ticket.ai_risk_level as string | null)?.toLowerCase()
                              if (!risk) return <span className="text-xs text-slate-300">—</span>
                              const cls = risk === 'high'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : risk === 'medium'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-50 text-slate-500 border-slate-200'
                              return (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${cls}`}>
                                  {risk === 'high' && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
                                  {risk}
                                </span>
                              )
                            })()}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-xs text-slate-400">
                              {new Date(ticket.created_at).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <svg className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </td>
                        </ClickableRow>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

      </div>
    </div>
  )
}
