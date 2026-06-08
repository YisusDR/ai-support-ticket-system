import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { StatusBadge } from '@/components/ui/Badge'
import { ActivityChart } from '@/components/ui/ActivityChart'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard — AI Support',
}

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

  // Fetch all tickets for metrics + chart
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

  const activityData = buildActivityData(tickets)
  const recentTickets = tickets.slice(0, 5)
  const firstName = profile.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="flex flex-col min-h-full bg-slate-50/40">
      <Navbar
        title="Dashboard"
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
                value: metrics.total,
                icon: (
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                ),
                valueColor: 'text-slate-950',
                accent: 'bg-slate-100',
              },
              {
                label: 'Open',
                value: metrics.open,
                icon: (
                  <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ),
                valueColor: 'text-blue-700',
                accent: 'bg-blue-50',
              },
              {
                label: 'In Progress',
                value: metrics.in_progress,
                icon: (
                  <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                valueColor: 'text-amber-700',
                accent: 'bg-amber-50',
              },
              {
                label: 'Resolved',
                value: metrics.resolved,
                icon: (
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                valueColor: 'text-emerald-700',
                accent: 'bg-emerald-50',
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
                <h2 className="text-sm font-semibold text-slate-950">Mi Actividad</h2>
                <p className="text-xs text-slate-400 mt-0.5">Últimos 7 días — creados vs. resueltos</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-6 h-0.5 rounded-full bg-emerald-500 inline-block" />
                  Creados
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-6 h-0.5 rounded-full bg-emerald-700 inline-block opacity-60" />
                  Resueltos
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
                <h2 className="text-sm font-semibold text-slate-950">Tickets Recientes</h2>
                <p className="text-xs text-slate-400 mt-0.5">Tus últimas solicitudes de soporte</p>
              </div>
              <Link
                href="/tickets"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1"
              >
                Ver todos
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {recentTickets.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-500">No tienes tickets todavía</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">Crea tu primer ticket para comenzar.</p>
                <Link
                  href="/tickets"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-md shadow-emerald-600/10"
                >
                  + Nuevo Ticket
                </Link>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/60">
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asunto</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentTickets.map((ticket) => (
                    <Link key={ticket.id} href={`/tickets/${ticket.id}`} legacyBehavior>
                      <tr className="hover:bg-slate-50/80 cursor-pointer transition-colors duration-100 group">
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-medium text-slate-800 truncate max-w-[360px] group-hover:text-emerald-700 transition-colors">
                            {ticket.title}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={ticket.status} />
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
                      </tr>
                    </Link>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

      </div>
    </div>
  )
}
