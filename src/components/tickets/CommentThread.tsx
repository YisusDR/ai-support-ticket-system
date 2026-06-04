'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import type { Comment } from '@/lib/types'

interface CommentThreadProps {
  ticketId: string
  currentUserId: string
  currentUserName: string | null
}

export function CommentThread({
  ticketId,
  currentUserId,
  currentUserName,
}: CommentThreadProps) {
  const supabase = createClient()
  const [comments, setComments] = useState<Comment[]>([])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchComments = async () => {
    const { data, error: fetchError } = await supabase
      .from('comments')
      .select('*, profiles(id, full_name, role)')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    if (!fetchError) {
      setComments(data ?? [])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchComments()

    const channel = supabase
      .channel(`comments-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => {
          fetchComments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = message.trim()
    if (!trimmed) return

    setIsSending(true)
    setError(null)

    const { error: insertError } = await supabase.from('comments').insert({
      ticket_id: ticketId,
      user_id: currentUserId,
      message: trimmed,
    })

    setIsSending(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setMessage('')
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-slate-700/50 border border-slate-700/50 flex items-center justify-center">
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-slate-200">
          Discussion
          {comments.length > 0 && (
            <span className="ml-2 text-xs text-slate-500 font-normal">
              {comments.length} message{comments.length !== 1 ? 's' : ''}
            </span>
          )}
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 mb-4 max-h-80 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner size="sm" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          comments.map((comment) => {
            const isOwn = comment.user_id === currentUserId
            const name = comment.profiles?.full_name ?? 'Unknown'
            const role = comment.profiles?.role
            const initials = name.charAt(0).toUpperCase()

            return (
              <div
                key={comment.id}
                className={`flex gap-3 animate-fade-in ${isOwn ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold ${
                    isOwn
                      ? 'bg-indigo-500/30 text-indigo-300'
                      : role === 'agent' || role === 'admin'
                      ? 'bg-violet-500/30 text-violet-300'
                      : 'bg-slate-700/80 text-slate-300'
                  }`}
                >
                  {initials}
                </div>

                {/* Bubble */}
                <div className={`flex flex-col gap-1 max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{name}</span>
                    {(role === 'agent' || role === 'admin') && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        {role}
                      </span>
                    )}
                  </div>
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isOwn
                        ? 'bg-indigo-600/30 text-indigo-100 border border-indigo-500/25 rounded-tr-sm'
                        : 'bg-slate-800/80 text-slate-200 border border-slate-700/50 rounded-tl-sm'
                    }`}
                  >
                    {comment.message}
                  </div>
                  <span className="text-[10px] text-slate-600">
                    {new Date(comment.created_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {error && (
        <p className="text-xs text-red-400 mb-2">{error}</p>
      )}
      <form onSubmit={handleSend} className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="input-base pr-12"
            disabled={isSending}
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSending}
          disabled={!message.trim() || isSending}
          className="flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </Button>
      </form>
    </div>
  )
}
