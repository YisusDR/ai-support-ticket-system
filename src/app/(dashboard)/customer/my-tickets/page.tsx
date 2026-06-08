import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import { ClickableRow } from '@/components/ui/ClickableRow'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { TicketStatus } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Mis Tickets — AI Support',
}

interface SearchParams {
  status?: string
}

export default async function MyTicketsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Build query — strict filter: only tickets where customer_id = logged-in user's id
  let query = supabase
    .from('tickets')
    .select('id, title, description, status, priority, created_at, updated_at')
    .eq('customer_id', user.id)   // ← exact match on current user only
    .order('created_at', { ascending: false })

  // Optional status filter from URL query param
  const validStatuses: TicketStatus[] = ['open', 'in_progress', 'resolved']
  const activeStatus =
    params.status && validStatuses.includes(params.status as TicketStatus)
      ? (params.status as TicketStatus)
      : null

  if (activeStatus) {
    query = query.eq('status', activeStatus)
  }

  const { data: tickets } = await query
  const all = tickets ?? []

  // Counts for filter chips
  const { data: countData } = await supabase
    .from('tickets')
    .select('status')
    .eq('customer_id', user.id)

  const counts = {
    all: countData?.length ?? 0,
    open: countData?.filter((t) => t.status === 'open').length ?? 0,
    in_progress: countData?.filter((t) => t.status === 'in_progress').length ?? 0,
    resolved: countData?.filter((t) => t.status === 'resolved').length ?? 0,
  }

  return (
    <div className="flex flex-col min-h-full bg-slate-50/40">
      <Navbar
        title="Mis Tickets"
        subtitle={`${counts.all} solicitudes de soporte en total`}
        actions={
          <Link
            href="/customer/new-ticket"
            id="my-tickets-new-btn"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-md shadow-emerald-600/10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Ticket
          </Link>
        }
      />

      <div className="flex-1 p-6 space-y-4 animate-fade-in">

        {/* ── Status filter chips ── */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: 'Todos', value: null, count: counts.all },
            { label: 'Abiertos', value: 'open', count: counts.open },
            { label: 'En Progreso', value: 'in_progress', count: counts.in_progress },
            { label: 'Resueltos', value: 'resolved', count: counts.resolved },
          ].map((chip) => {
            const isActive = chip.value === activeStatus
            const href = chip.value
              ? `/customer/my-tickets?status=${chip.value}`
              : '/customer/my-tickets'
            return (
              <Link
                key={chip.label}
                href={href}
                id={`filter-${chip.value ?? 'all'}`}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/10'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
                }`}
              >
                {chip.label}
                <span
                  className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {chip.count}
                </span>
              </Link>
            )
          })}
        </div>

        {/* ── Tickets table ── */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
          {all.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-600 mb-1">
                {activeStatus ? 'Sin tickets con este estado' : 'No tienes tickets'}
              </p>
              <p className="text-xs text-slate-400 mb-5">
                {activeStatus
                  ? 'Prueba con otro filtro o crea un nuevo ticket.'
                  : 'Crea tu primer ticket para comenzar.'}
              </p>
              {!activeStatus && (
                <Link
                  href="/customer/new-ticket"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
                >
                  + Crear ticket
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="px-5 py-3.5 border-b border-slate-50 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Mostrando <strong className="text-slate-800">{all.length}</strong> ticket{all.length !== 1 ? 's' : ''}
                  {activeStatus && (
                    <span className="ml-1 text-emerald-600">
                      · filtrado por <strong>{activeStatus}</strong>
                    </span>
                  )}
                </p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/60">
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asunto</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Descripción</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Prioridad</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Fecha</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {all.map((ticket) => (
                    <ClickableRow key={ticket.id} href={`/tickets/${ticket.id}`}>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors truncate max-w-[200px]">
                          {ticket.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 md:hidden truncate max-w-[200px]">
                          {ticket.description?.slice(0, 60)}…
                        </p>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell max-w-[260px]">
                        <p className="text-sm text-slate-500 truncate">
                          {ticket.description
                            ? ticket.description.length > 80
                              ? ticket.description.slice(0, 80) + '…'
                              : ticket.description
                            : '—'}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        {ticket.priority ? (
                          <PriorityBadge priority={ticket.priority} />
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <span className="text-xs text-slate-400">
                          {new Date(ticket.created_at).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <svg className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </td>
                    </ClickableRow>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
