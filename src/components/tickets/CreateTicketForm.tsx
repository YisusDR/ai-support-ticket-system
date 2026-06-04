'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

interface CreateTicketFormProps {
  userId: string
  onSuccess?: () => void
}

export function CreateTicketForm({ userId, onSuccess }: CreateTicketFormProps) {
  const supabase = createClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return

    setIsLoading(true)
    setError(null)
    setSuccess(false)

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

    setTitle('')
    setDescription('')
    setSuccess(true)
    onSuccess?.()

    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <Card variant="elevated">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
          <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-100">New Ticket</h2>
          <p className="text-xs text-slate-500">Describe your issue and our AI will assist</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="ticket-title"
          label="Title"
          placeholder="Brief description of your issue"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={120}
        />

        <Textarea
          id="ticket-description"
          label="Description"
          placeholder="Provide as much detail as possible about the issue you're experiencing..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
        />

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm animate-fade-in">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Ticket submitted! Our AI is analyzing it now.
          </div>
        )}

        <div className="flex justify-end pt-1">
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
    </Card>
  )
}
