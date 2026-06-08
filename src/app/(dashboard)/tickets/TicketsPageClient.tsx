'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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

  // Form states for creating a ticket
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const dialogRef = useRef<HTMLDialogElement>(null)

  const fetchTickets = useCallback(async () => {
    let query = supabase
      .from('tickets')
      .select('*, profiles:customer_id(id, full_name, role)')
      .order('created_at', { ascending: false })

    if (isCustomer) {
      query = query.eq('customer_id', currentUser.id)
    }

    const { data, error: fetchError } = await query
    if (fetchError) {
      setError(fetchError.message)
    } else {
      setTickets((data as unknown as Ticket[]) ?? [])
    }
    setIsLoading(false)
  }, [isCustomer, currentUser.id, supabase])

  useEffect(() => {
    fetchTickets()

    const channel = supabase
      .channel('tickets-list-realtime')
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

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchTickets, isCustomer, currentUser.id, supabase])

  // Sync open state with native <dialog>
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (modalOpen) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [modalOpen])

  const handleCloseModal = () => {
    setNewTitle('')
    setNewDescription('')
    setCreateError(null)
    setModalOpen(false)
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newDescription.trim()) return

    setIsCreating(true)
    setCreateError(null)

    const { error: insertError } = await supabase.from('tickets').insert({
      title: newTitle.trim(),
      description: newDescription.trim(),
      customer_id: currentUser.id,
      status: 'open',
    })

    setIsCreating(false)

    if (insertError) {
      setCreateError(insertError.message)
      return
    }

    handleCloseModal()
    fetchTickets()
  }

  // Helper colors for Freshdesk status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white shadow-sm">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-100" />
            Resuelto
          </span>
        )
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500 animate-pulse" />
            En Progreso
          </span>
        )
      case 'open':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-600" />
            Abierto
          </span>
        )
    }
  }

  // Priority layout matching Supabase values
  const getPriorityBadge = (priority: string) => {
    if (priority?.toLowerCase() === 'high') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-600 text-white tracking-wide shadow-sm uppercase">
          High
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 uppercase">
        Low
      </span>
    )
  }

  return (
    <div className="flex-1 bg-white p-8">
      {/* Header section with Freshdesk feel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">
            {isCustomer ? 'Mis Tickets de Soporte' : 'Panel de Control de Tickets'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isCustomer
              ? 'Consulta y gestiona el progreso de tus consultas de soporte en tiempo real.'
              : 'Lista completa de casos clasificados por el modelo de inteligencia artificial.'}
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-150 active:scale-[0.98] w-full md:w-auto"
        >
          <svg className="w-4 h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          + Nuevo Ticket
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-150 rounded-xl shadow-sm overflow-hidden min-w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Cargando tickets...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="inline-flex p-3 rounded-full bg-red-50 text-red-600 mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-950">{error}</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-950">No hay tickets registrados</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
              {isCustomer
                ? 'Comienza creando tu primer ticket de soporte usando el botón de la parte superior.'
                : 'No se encontraron tickets en el sistema en este momento.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">
                    Solicitante
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-2/5">
                    Asunto
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Prioridad IA
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell text-right">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((ticket) => {
                  const requesterName = ticket.profiles?.full_name ?? 'Usuario de Soporte'
                  const initials = requesterName.charAt(0).toUpperCase()
                  
                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => router.push(`/tickets/${ticket.id}`)}
                      className="group hover:bg-slate-50/50 transition-colors duration-150 cursor-pointer"
                    >
                      {/* Solicitante */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shadow-inner flex-shrink-0">
                            {initials}
                          </div>
                          <div className="text-sm font-semibold text-slate-950 truncate max-w-[180px]">
                            {requesterName}
                          </div>
                        </div>
                      </td>

                      {/* Asunto */}
                      <td className="px-6 py-4.5">
                        <div className="flex flex-col gap-0.5 max-w-lg">
                          <span className="font-semibold text-slate-950 group-hover:text-emerald-700 transition-colors line-clamp-1 text-sm">
                            {ticket.title}
                          </span>
                          <span className="text-xs text-slate-500 line-clamp-1">
                            {ticket.description}
                          </span>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        {getStatusBadge(ticket.status)}
                      </td>

                      {/* Prioridad IA */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        {getPriorityBadge(ticket.priority)}
                      </td>

                      {/* Fecha */}
                      <td className="px-6 py-4.5 text-xs text-slate-500 whitespace-nowrap text-right hidden sm:table-cell">
                        {new Date(ticket.created_at).toLocaleDateString('es-ES', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Total Count Footer */}
        {!isLoading && tickets.length > 0 && (
          <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>Mostrando {tickets.length} ticket(s)</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Sincronización en tiempo real activa
            </span>
          </div>
        )}
      </div>

      {/* Floating Dialog Modal for Creating Tickets */}
      <dialog
        ref={dialogRef}
        className="fixed inset-0 m-auto w-[90%] max-w-lg rounded-2xl border border-slate-100 bg-white p-0 shadow-2xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm overflow-hidden"
        onClose={handleCloseModal}
      >
        <div className="p-6">
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </span>
                Crear Nuevo Ticket
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                La IA categorizará tu solicitud automáticamente tras enviarla.
              </p>
            </div>
            <button
              onClick={handleCloseModal}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
              aria-label="Cerrar modal"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Modal Form */}
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <label htmlFor="ticket-title" className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                Asunto del Ticket
              </label>
              <input
                id="ticket-title"
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ej. Error al conectar la base de datos de pruebas"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label htmlFor="ticket-description" className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                Descripción Detallada
              </label>
              <textarea
                id="ticket-description"
                required
                rows={5}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Por favor describe el inconveniente lo más detallado posible..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
              />
            </div>

            {createError && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-150 text-red-700 text-xs">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{createError}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 mt-6">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-colors"
              >
                {isCreating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-emerald-100 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Crear Ticket'
                )}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  )
}
