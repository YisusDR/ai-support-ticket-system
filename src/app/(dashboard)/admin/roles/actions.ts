'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { UserRole } from '@/lib/types'

/**
 * Server Action — update a user's role in the `profiles` table.
 * Only callable by authenticated admins (enforced by the /admin layout guard).
 */
export async function updateUserRole(userId: string, newRole: UserRole) {
  const supabase = await createClient()

  // Double-check the caller is still an admin before writing
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!callerProfile || callerProfile.role !== 'admin') {
    throw new Error('Unauthorized: admin role required')
  }

  // Prevent an admin from revoking their own admin status
  if (userId === user.id && newRole !== 'admin') {
    throw new Error('Cannot change your own role')
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/roles')
}
