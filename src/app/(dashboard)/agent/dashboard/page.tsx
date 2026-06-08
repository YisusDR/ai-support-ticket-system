import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Agent Dashboard — AI Support',
}

/**
 * /agent/dashboard — server-side guard, then delegates to the existing /agent page.
 * The (dashboard) layout already checks auth; this adds role check for agent|admin.
 */
export default async function AgentDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role === 'customer') {
    redirect('/unauthorized')
  }

  // Redirect to the canonical agent page which has the full dashboard UI
  redirect('/agent')
}
