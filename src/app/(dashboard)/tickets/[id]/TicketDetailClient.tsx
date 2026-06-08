'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { Ticket, Profile, Comment } from '@/lib/types'

interface TicketDetailClientProps {
  ticketId: string
  currentUser: { id: string; profile: Profile }
}

// ── CopyButton — clipboard helper for AI suggested response ───────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [text])

  return (
    <button
      onClick={handleCopy}
      id="copy-ai-suggestion-btn"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all duration-200 ${
        copied
          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
      }`}
    >
      {copied ? (
        <>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Copiado
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copiar respuesta sugerida
        </>
      )}
    </button>
  )
}


export function TicketDetailClient({ ticketId, currentUser }: TicketDetailClientProps) {
  const supabase = createClient()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchTicketAndComments = async () => {
    // Fetch ticket with requester profile
    const { data: ticketData, error: ticketError } = await supabase
      .from('tickets')
      .select('*, profiles:customer_id(id, full_name, role)')
      .eq('id', ticketId)
      .single()

    if (ticketError) {
      setError(ticketError.message)
      setIsLoading(false)
      return
    }
    
    setTicket(ticketData as unknown as Ticket)

    // Fetch comments with author profiles
    const { data: commentsData, error: commentsError } = await supabase
      .from('comments')
      .select('*, profiles(id, full_name, role)')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    if (!commentsError && commentsData) {
      setComments(commentsData as unknown as Comment[])
    }

    setIsLoading(false)
  }

  useEffect(() => {
    fetchTicketAndComments()

    // Realtime subscription for ticket updates
    const ticketChannel = supabase
      .channel(`ticket-${ticketId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `id=eq.${ticketId}` },
        () => fetchTicketAndComments() // Re-fetch to get nested profile data safely
      )
      .subscribe()

    // Realtime subscription for new comments
    const commentsChannel = supabase
      .channel(`comments-${ticketId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `ticket_id=eq.${ticketId}` },
        () => fetchTicketAndComments()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(ticketChannel)
      supabase.removeChannel(commentsChannel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId])

  // Scroll to bottom when comments change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    const { error: insertError } = await supabase.from('comments').insert({
      ticket_id: ticketId,
      user_id: currentUser.id,
      message: newMessage.trim(),
    })

    if (!insertError) {
      setNewMessage('')
    }
    setIsSending(false)
  }

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdatingStatus(true)
    await supabase
      .from('tickets')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', ticketId)
    setIsUpdatingStatus(false)
  }

  // UI Helpers
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white shadow-sm">
            Resuelto
          </span>
        )
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            En Progreso
          </span>
        )
      case 'open':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
            Abierto
          </span>
        )
    }
  }

  const getPriorityBadge = (priority: string) => {
    if (priority?.toLowerCase() === 'high') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-600 text-white uppercase tracking-wide">
          Alta
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
        {priority === 'medium' ? 'Media' : 'Baja'}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="flex-1 bg-white flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="flex-1 bg-white p-8">
        <div className="max-w-4xl mx-auto p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
          Error: {error || 'Ticket no encontrado'}
        </div>
      </div>
    )
  }

  const requester = ticket.profiles || { full_name: 'Usuario Desconocido', role: 'customer' }
  const requesterInitials = requester.full_name?.charAt(0).toUpperCase() || 'U'

  return (
    <div className="flex-1 bg-white min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Top Navigation */}
        <div className="mb-6">
          <Link 
            href="/tickets" 
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-emerald-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a Tickets
          </Link>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* ==========================================
              PANEL PRINCIPAL (Izquierda 70%)
              ========================================== */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Header / Asunto */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm font-mono text-slate-400 font-medium">#{ticket.id.split('-')[0].toUpperCase()}</span>
                <span className="text-slate-300">•</span>
                <span className="text-sm text-slate-500">
                  {new Date(ticket.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-950 mb-6 leading-tight">
                {ticket.title}
              </h1>
              
              <div className="prose prose-slate max-w-none">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Descripción Original</h3>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm md:text-base bg-slate-50 p-4 rounded-lg border border-slate-100">
                  {ticket.description}
                </p>
              </div>
            </div>

            {/* Hilo de Chat */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h2 className="text-base font-bold text-slate-950 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Discusión del Ticket
                </h2>
                <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                  {comments.length} mensajes
                </span>
              </div>
              
              {/* Messages Area */}
              <div className="p-6 overflow-y-auto max-h-[500px] space-y-6 bg-slate-50/30">
                {comments.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-sm text-slate-500">Aún no hay comentarios. Escribe un mensaje abajo para comenzar.</p>
                  </div>
                ) : (
                  comments.map((comment) => {
                    // Check if it's the current user or someone else
                    const isCurrentUser = comment.user_id === currentUser.id;
                    const authorProfile = comment.profiles || { full_name: 'Usuario', role: 'customer' };
                    const isAgent = authorProfile.role === 'agent' || authorProfile.role === 'admin';
                    
                    // Bubble styling based on request: white for user, ultra-light gray for agent
                    const bubbleBg = isCurrentUser 
                      ? 'bg-white border border-slate-200' 
                      : 'bg-slate-50 border border-slate-200/60';
                    
                    const alignClass = isCurrentUser ? 'items-end' : 'items-start';
                    const textClass = 'text-slate-800';

                    return (
                      <div key={comment.id} className={`flex flex-col ${alignClass} animate-fade-in`}>
                        <div className="flex items-center gap-2 mb-1.5 px-1">
                          <span className="text-xs font-bold text-slate-900">{authorProfile.full_name}</span>
                          {isAgent && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-sm">
                              Agente
                            </span>
                          )}
                          <span className="text-xs text-slate-400 ml-1">
                            {new Date(comment.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 shadow-sm text-sm ${bubbleBg} ${textClass}`}>
                          <p className="whitespace-pre-wrap leading-relaxed">{comment.message}</p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-slate-100 bg-white">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe tu respuesta aquí..."
                    disabled={isSending}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-all shadow-sm flex items-center gap-2"
                  >
                    {isSending ? (
                      <div className="w-4 h-4 border-2 border-emerald-200 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Enviar
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* ==========================================
              PANEL LATERAL (Derecha 30%)
              ========================================== */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Detalles del Ticket */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">
                Propiedades
              </h3>
              
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">Estado</span>
                  {getStatusBadge(ticket.status)}
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">Prioridad IA</span>
                  {getPriorityBadge(ticket.priority)}
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Información del Solicitante
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shadow-inner">
                      {requesterInitials}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-950">{requester.full_name}</p>
                      <p className="text-xs text-slate-500 capitalize">{requester.role}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Acciones para el Agente */}
              {(currentUser.profile.role === 'agent' || currentUser.profile.role === 'admin') && (
                <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
                  {ticket.status !== 'in_progress' && ticket.status !== 'resolved' && (
                    <button
                      onClick={() => handleStatusChange('in_progress')}
                      disabled={isUpdatingStatus}
                      className="w-full py-2 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                    >
                      Marcar en Progreso
                    </button>
                  )}
                  {ticket.status !== 'resolved' && (
                    <button
                      onClick={() => handleStatusChange('resolved')}
                      disabled={isUpdatingStatus}
                      className="w-full py-2 bg-emerald-600 border border-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                    >
                      Resolver Ticket
                    </button>
                  )}
                  {ticket.status === 'resolved' && (
                    <button
                      onClick={() => handleStatusChange('open')}
                      disabled={isUpdatingStatus}
                      className="w-full py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                    >
                      Reabrir Ticket
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* AI Copilot Card — datos reales de n8n */}
            <div className="rounded-xl border border-slate-200 shadow-md overflow-hidden">
              {/* Header */}
              <div className="bg-slate-950 px-5 py-4 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white leading-none">AI Copilot</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                    {ticket.ai_model_version
                      ? `Modelo: ${ticket.ai_model_version}`
                      : 'Powered by n8n + Gemini'}
                  </p>
                </div>
                {/* Status dot */}
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {ticket.ai_summary ? 'Analizado' : 'Pendiente'}
                </div>
              </div>

              {/* Body */}
              <div className="bg-slate-900 px-5 py-5 space-y-5">

                {/* Resumen Ejecutivo */}
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Resumen Ejecutivo
                  </span>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {ticket.ai_summary
                      ? ticket.ai_summary
                      : <span className="italic text-slate-500">Análisis pendiente. El modelo está procesando este ticket.</span>}
                  </p>
                </div>

                {/* Nivel de Riesgo */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Nivel de Riesgo IA
                    </span>
                    {ticket.ai_risk_level ? (
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        (ticket.ai_risk_level as string).toLowerCase() === 'high'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : (ticket.ai_risk_level as string).toLowerCase() === 'medium'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {ticket.ai_risk_level as string}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-600">—</span>
                    )}
                  </div>
                  {(() => {
                    const level = (ticket.ai_risk_level as string | null)?.toLowerCase()
                    const pct = level === 'high' ? 88 : level === 'medium' ? 50 : level === 'low' ? 18 : 0
                    const bar = level === 'high' ? 'bg-red-500' : level === 'medium' ? 'bg-amber-400' : 'bg-emerald-500'
                    return (
                      <div className="space-y-1">
                        <div className="w-full bg-slate-800 rounded-full h-1.5 border border-slate-700 overflow-hidden">
                          <div
                            className={`h-full ${bar} transition-all duration-1000 ease-out`}
                            style={{ width: pct > 0 ? `${pct}%` : '5%', opacity: pct > 0 ? 1 : 0.3 }}
                          />
                        </div>
                        <p className="text-right text-[10px] text-slate-600">
                          {pct > 0 ? `${pct}% de riesgo estimado` : 'Sin datos'}
                        </p>
                      </div>
                    )
                  })()}
                </div>

                {/* Modelo utilizado */}
                {ticket.ai_model_version && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                    <svg className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[11px] text-slate-400">Modelo:</span>
                    <span className="text-[11px] font-mono font-semibold text-emerald-300">{ticket.ai_model_version as string}</span>
                  </div>
                )}

                {/* Sugerencias de resolución + botón copiar */}
                <div className="pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Respuesta Sugerida
                    </span>
                    {ticket.ai_suggestions && (
                      <CopyButton text={ticket.ai_suggestions as string} />
                    )}
                  </div>
                  {ticket.ai_suggestions ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-sm text-emerald-100 leading-relaxed whitespace-pre-wrap">
                      {ticket.ai_suggestions as string}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 italic">
                      Sin sugerencias disponibles aún.
                    </p>
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
