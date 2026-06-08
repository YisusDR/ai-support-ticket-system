import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Métricas Admin — AI Support',
}

export default async function AdminMetricsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch aggregate metrics
  const { data: tickets } = await supabase
    .from('tickets')
    .select('status, priority, assigned_to, created_at')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, role, full_name')

  const all = tickets ?? []
  const users = profiles ?? []

  const metrics = {
    total: all.length,
    open: all.filter((t) => t.status === 'open').length,
    in_progress: all.filter((t) => t.status === 'in_progress').length,
    resolved: all.filter((t) => t.status === 'resolved').length,
    high: all.filter((t) => t.priority === 'high').length,
    totalUsers: users.length,
    customers: users.filter((u) => u.role === 'customer').length,
    agents: users.filter((u) => u.role === 'agent').length,
    admins: users.filter((u) => u.role === 'admin').length,
    resolutionRate: all.length
      ? Math.round((all.filter((t) => t.status === 'resolved').length / all.length) * 100)
      : 0,
    openOnly: all.filter((t) => t.status === 'open').length,
    priorityCount: {
      low: all.filter((t) => t.priority === 'low').length,
      medium: all.filter((t) => t.priority === 'medium').length,
      high: all.filter((t) => t.priority === 'high').length,
    }
  }

  // Calculate agent workload
  const agents = users.filter((u) => u.role === 'agent')
  const agentWorkload = agents.map((agent) => {
    const assignedTickets = all.filter((t) => t.assigned_to === agent.id).length
    return {
      id: agent.id,
      name: agent.full_name || 'Agente Desconocido',
      count: assignedTickets,
    }
  }).sort((a, b) => b.count - a.count)

  const maxWorkload = Math.max(...agentWorkload.map((a) => a.count), 1)
  const totalPriority = metrics.priorityCount.low + metrics.priorityCount.medium + metrics.priorityCount.high || 1

  return (
    <div className="flex flex-col min-h-full bg-slate-50/40">
      <Navbar title="Métricas" subtitle="Panel de administración — visión global del sistema" />

      <div className="flex-1 p-6 space-y-6 animate-fade-in">
        {/* Ticket Metrics */}
        <section>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Tickets</p>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total', value: metrics.total, color: 'text-slate-950', bg: 'bg-slate-100' },
              { label: 'Abiertos', value: metrics.open, color: 'text-blue-700', bg: 'bg-blue-50' },
              { label: 'En Progreso', value: metrics.in_progress, color: 'text-amber-700', bg: 'bg-amber-50' },
              { label: 'Resueltos', value: metrics.resolved, color: 'text-emerald-700', bg: 'bg-emerald-50' },
              { label: 'Alta Prioridad', value: metrics.high, color: 'text-red-700', bg: 'bg-red-50' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{s.label}</p>
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Graphical Distributions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="space-y-6">
            {/* Open vs Resolved */}
            <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-slate-950 mb-1">Abiertos vs. Resueltos</h2>
              <p className="text-xs text-slate-400 mb-6">Comparativa de tickets pendientes y finalizados</p>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-xs font-semibold text-slate-600">Abiertos</span>
                    <span className="text-sm font-bold text-blue-600">{metrics.openOnly}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full transition-all duration-700" style={{ width: `${Math.round((metrics.openOnly / (metrics.total || 1)) * 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-xs font-semibold text-slate-600">Resueltos</span>
                    <span className="text-sm font-bold text-emerald-600">{metrics.resolved}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-700" style={{ width: `${Math.round((metrics.resolved / (metrics.total || 1)) * 100)}%` }} />
                  </div>
                </div>
              </div>
            </section>

            {/* Priority Distribution */}
            <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-slate-950 mb-1">Distribución por Prioridad</h2>
              <p className="text-xs text-slate-400 mb-6">Proporción de tickets según su criticidad</p>

              <div className="space-y-4">
                {[
                  { label: 'Alta', count: metrics.priorityCount.high, color: 'bg-red-500', textCol: 'text-red-600' },
                  { label: 'Media', count: metrics.priorityCount.medium, color: 'bg-amber-400', textCol: 'text-amber-600' },
                  { label: 'Baja', count: metrics.priorityCount.low, color: 'bg-emerald-500', textCol: 'text-emerald-600' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-xs font-semibold text-slate-600">{item.label}</span>
                      <span className={`text-sm font-bold ${item.textCol}`}>{item.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className={`${item.color} h-full rounded-full transition-all duration-700`} style={{ width: `${Math.round((item.count / totalPriority) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Workload Distribution */}
          <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-950 mb-1">Carga de Trabajo por Agente</h2>
            <p className="text-xs text-slate-400 mb-6">Tickets asignados actualmente a cada miembro del equipo de soporte</p>
            
            <div className="space-y-5">
              {agentWorkload.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No hay agentes registrados en el sistema.</p>
              ) : (
                agentWorkload.map((agent) => (
                  <div key={agent.id}>
                    <div className="flex justify-between items-end mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700 uppercase">
                          {agent.name.charAt(0)}
                        </div>
                        <span className="text-xs font-semibold text-slate-700 truncate max-w-[150px]">{agent.name}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{agent.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-700" style={{ width: `${Math.round((agent.count / maxWorkload) * 100)}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
