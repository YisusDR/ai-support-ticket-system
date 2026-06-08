'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import type { UserRole } from '@/lib/types'

interface ProtectedRouteProps {
  /** Roles that are allowed to access this route */
  allowedRoles: UserRole[]
  /** Where to redirect unauthorized users (default: /unauthorized) */
  redirectTo?: string
  children: React.ReactNode
}

export function ProtectedRoute({
  allowedRoles,
  redirectTo = '/unauthorized',
  children,
}: ProtectedRouteProps) {
  const { role, isLoading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    // Not logged in → go to login
    if (!user) {
      router.replace('/login')
      return
    }

    // Logged in but wrong role → go to unauthorized
    if (role && !allowedRoles.includes(role)) {
      router.replace(redirectTo)
    }
  }, [isLoading, user, role, allowedRoles, redirectTo, router])

  // While resolving, show a clean loading state
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Verificando acceso...</p>
        </div>
      </div>
    )
  }

  // Role mismatch — blank while redirect fires
  if (role && !allowedRoles.includes(role)) {
    return null
  }

  return <>{children}</>
}
