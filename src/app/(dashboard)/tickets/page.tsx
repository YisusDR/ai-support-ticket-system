import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TicketsPageClient } from './TicketsPageClient'
import type { Metadata } from 'next'
import type { Profile } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Tickets — AI Support',
}

export default async function TicketsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="flex flex-col min-h-full">
      <TicketsPageClient
        currentUser={{ id: user.id, profile: profile as Profile }}
      />
    </div>
  )
}
