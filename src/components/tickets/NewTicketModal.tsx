'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'

interface NewTicketModalProps {
  userId: string
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export function NewTicketModal({ userId, open, onClose, onCreated }: NewTicketModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync open state with <dialog>
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [open])

  // Close on backdrop click
  const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      handleClose()
    }
  }

  const handleClose = () => {
    setTitle('')
    setDescription('')
    setError(null)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return

    setIsLoading(true)
    setError(null)

    const { error: insertError } = await supabase.from('tickets').insert({
      title: title.trim(),
      description: description.trim(),
      customer_id: userId,
      status: 'open',
    })

    setIsLoading(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    handleClose()
    onCreated()
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={handleDialogClick}
      onClose={handleClose}
      className="fixed inset-0 m-auto w-full max-w-lg rounded-2xl border border-slate-700/60 bg-slate-900 p-0 shadow-2xl shadow-black/60 backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">New Support Ticket</h2>
            <p className="text-xs text-slate-500">Our AI will analyze your request automatically</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <Input
          id="modal-ticket-title"
          label="Title"
          placeholder="Brief description of your issue"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={120}
          autoFocus
        />

        <Textarea
          id="modal-ticket-description"
          label="Description"
          placeholder="Describe the issue in detail — the more context, the better the AI analysis."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={5}
        />

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            leftIcon={
              !isLoading && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )
            }
          >
            Submit Ticket
          </Button>
        </div>
      </form>
    </dialog>
  )
}
