import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { TicketTable } from '@/components/tickets/TicketTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'All Tickets — AI Support',
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

  // Count by status for the stats bar
  const { data: tickets } = await supabase
    .from('tickets')
    .select('status, priority')

  const stats = {
    total: tickets?.length ?? 0,
    open: tickets?.filter((t) => t.status === 'open').length ?? 0,
    in_progress: tickets?.filter((t) => t.status === 'in_progress').length ?? 0,
    resolved: tickets?.filter((t) => t.status === 'resolved').length ?? 0,
    high_priority: tickets?.filter((t) => t.priority === 'high').length ?? 0,
  }

  return (
    <div className="flex flex-col h-full">
      <Navbar
        title={profile.role === 'admin' ? 'Admin Dashboard' : 'Agent Dashboard'}
        subtitle="All tickets sorted by AI priority"
      />

      <div className="flex-1 p-6 space-y-6 animate-fade-in">
        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Tickets',
              value: stats.total,
              icon: '🎫',
              color: 'from-slate-700/50 to-slate-800/50 border-slate-600/30',
              textColor: 'text-slate-300',
            },
            {
              label: 'Open',
              value: stats.open,
              icon: '📬',
              color: 'from-blue-500/10 to-blue-600/5 border-blue-500/20',
              textColor: 'text-blue-400',
            },
            {
              label: 'In Progress',
              value: stats.in_progress,
              icon: '⚡',
              color: 'from-amber-500/10 to-amber-600/5 border-amber-500/20',
              textColor: 'text-amber-400',
            },
            {
              label: 'High Priority',
              value: stats.high_priority,
              icon: '🔴',
              color: 'from-red-500/10 to-red-600/5 border-red-500/20',
              textColor: 'text-red-400',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-xl border bg-gradient-to-br p-4 ${stat.color} backdrop-blur-sm`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {stat.label}
                </span>
                <span className="text-base">{stat.icon}</span>
              </div>
              <p className={`text-2xl font-bold ${stat.textColor}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Tickets table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              All Tickets
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50 border border-slate-700/50 px-3 py-1.5 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Live updates
            </div>
          </div>
          <TicketTable showPriority clickable />
        </div>
      </div>
    </div>
  )
}
