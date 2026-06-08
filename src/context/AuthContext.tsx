'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile, UserRole } from '@/lib/types'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface AuthState {
  user: User | null
  profile: Profile | null
  role: UserRole | null
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  /** Call after a sign-out to clear local state immediately */
  clearAuth: () => void
  /** Re-fetch the profile (e.g. after a role change) */
  refreshProfile: () => Promise<void>
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()

  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    role: null,
    isLoading: true,
  })

  // Fetch user + role from `profiles` table
  const loadProfile = useCallback(
    async (userId: string) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', userId)
        .single()

      return profile as Profile | null
    },
    [supabase]
  )

  const initialize = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }))
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setState({ user: null, profile: null, role: null, isLoading: false })
        return
      }

      const profile = await loadProfile(user.id)
      setState({
        user,
        profile,
        role: profile?.role ?? null,
        isLoading: false,
      })
    } catch {
      setState({ user: null, profile: null, role: null, isLoading: false })
    }
  }, [supabase, loadProfile])

  // Run once on mount + subscribe to auth state changes
  useEffect(() => {
    let isMounted = true

    initialize()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await loadProfile(session.user.id)
        if (!isMounted) return
        setState({
          user: session.user,
          profile,
          role: profile?.role ?? null,
          isLoading: false,
        })
      } else if (event === 'SIGNED_OUT') {
        if (!isMounted) return
        setState({ user: null, profile: null, role: null, isLoading: false })
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [initialize, supabase, loadProfile])

  const clearAuth = useCallback(() => {
    setState({ user: null, profile: null, role: null, isLoading: false })
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!state.user) return
    const profile = await loadProfile(state.user.id)
    setState((prev) => ({
      ...prev,
      profile,
      role: profile?.role ?? null,
    }))
  }, [state.user, loadProfile])

  return (
    <AuthContext.Provider
      value={{ ...state, clearAuth, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}
