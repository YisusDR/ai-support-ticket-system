'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

interface TicketStatusButtonProps {
  ticketId: string
  currentStatus: string
  userRole: string
  onResolved?: () => void
}

export function TicketStatusButton({
  ticketId,
  currentStatus,
  userRole,
  onResolved,
}: TicketStatusButtonProps) {
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isResolved = currentStatus === 'resolved'
  const canResolve = userRole === 'agent' || userRole === 'admin'

  if (!canResolve) return null

  const handleResolve = async () => {
    setIsLoading(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('tickets')
      .update({ status: 'resolved' })
      .eq('id', ticketId)

    setIsLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    onResolved?.()
  }

  if (isResolved) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Ticket Resolved
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="success"
        onClick={handleResolve}
        isLoading={isLoading}
        leftIcon={
          !isLoading && (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        }
      >
        Mark as Resolved
      </Button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
