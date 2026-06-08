'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Navbar } from '@/components/layout/Navbar'

function NewTicketForm() {
  const supabase = createClient()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { error: insertError } = await supabase.from('tickets').insert({
        title,
        description,
        customer_id: user.id,
        status: 'open',
      })

      if (insertError) throw insertError
      router.push('/customer/my-tickets')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el ticket')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-slate-50/40">
      <Navbar title="Nuevo Ticket" subtitle="Describe tu problema y te ayudaremos" />

      <div className="flex-1 p-6 animate-fade-in">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="ticket-title" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Asunto <span className="text-red-400">*</span>
                </label>
                <input
                  id="ticket-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Describe brevemente el problema..."
                  required
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                />
              </div>

              <div>
                <label htmlFor="ticket-description" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Descripción <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="ticket-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Proporciona todos los detalles relevantes sobre tu problema..."
                  required
                  rows={6}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim() || !description.trim()}
                  id="submit-ticket-btn"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors shadow-md shadow-emerald-600/10"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Crear Ticket
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-5 py-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NewTicketPage() {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <NewTicketForm />
    </ProtectedRoute>
  )
}
