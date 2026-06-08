'use client'

import { useState, useTransition } from 'react'
import { updateUserRole } from './actions'
import type { UserRole } from '@/lib/types'

interface RoleSelectorProps {
  userId: string
  currentRole: UserRole
  /** The currently logged-in admin's own ID — used to disable self-role changes */
  currentAdminId: string
}

const ROLES: UserRole[] = ['customer', 'agent', 'admin']

const roleStyles: Record<UserRole, string> = {
  customer: 'text-slate-700',
  agent: 'text-emerald-700',
  admin: 'text-violet-700',
}

export function RoleSelector({ userId, currentRole, currentAdminId }: RoleSelectorProps) {
  const [role, setRole] = useState<UserRole>(currentRole)
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isSelf = userId === currentAdminId

  const handleChange = async (newRole: UserRole) => {
    if (newRole === role) return
    setStatus('saving')
    setErrorMsg(null)

    startTransition(async () => {
      try {
        await updateUserRole(userId, newRole)
        setRole(newRole)
        setStatus('success')
        // Reset success indicator after 2s
        setTimeout(() => setStatus('idle'), 2000)
      } catch (err) {
        setStatus('error')
        setErrorMsg(err instanceof Error ? err.message : 'Error al actualizar')
        setTimeout(() => setStatus('idle'), 3000)
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <select
          value={role}
          onChange={(e) => handleChange(e.target.value as UserRole)}
          disabled={isPending || isSelf}
          id={`role-select-${userId}`}
          className={`appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed ${
            status === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : status === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : `border-slate-200 bg-white ${roleStyles[role]}`
          }`}
          title={isSelf ? 'No puedes cambiar tu propio rol' : 'Cambiar rol'}
        >
          {ROLES.map((r) => (
            <option key={r} value={r} className="capitalize">
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>

        {/* Chevron icon */}
        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
          {isPending ? (
            <div className="w-3 h-3 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          ) : (
            <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>

      {/* Status indicator */}
      {status === 'success' && (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium animate-fade-in">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Guardado
        </span>
      )}
      {status === 'error' && errorMsg && (
        <span className="text-xs text-red-500 font-medium" title={errorMsg}>
          ✕ {errorMsg.length > 30 ? errorMsg.slice(0, 30) + '…' : errorMsg}
        </span>
      )}
      {isSelf && (
        <span className="text-[10px] text-slate-400 italic">(tú)</span>
      )}
    </div>
  )
}
