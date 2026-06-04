import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { TicketDetailClient } from './TicketDetailClient'
import type { Metadata } from 'next'
import type { Profile } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Ticket Detail — AI Support',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TicketDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="flex flex-col min-h-full">
      <Navbar
        title="Ticket Detail"
        subtitle="View and respond to this support request"
      />
      <TicketDetailClient
        ticketId={id}
        currentUser={{ id: user.id, profile: profile as Profile }}
      />
    </div>
  )
}
