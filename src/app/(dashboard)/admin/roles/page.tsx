import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { RoleSelector } from './RoleSelector'
import type { Metadata } from 'next'
import type { UserRole } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Gestión de Roles — AI Support',
}

interface ProfileRow {
  id: string
  full_name: string | null
  role: UserRole
}

export default async function AdminRolesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all user profiles (id, full_name, role)
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .order('role')
    .order('full_name')

  if (error) {
    console.error('[AdminRoles] profiles fetch error:', error.message)
  }

  const all: ProfileRow[] = (profiles ?? []) as ProfileRow[]

  const counts = {
    customer: all.filter((p) => p.role === 'customer').length,
    agent: all.filter((p) => p.role === 'agent').length,
    admin: all.filter((p) => p.role === 'admin').length,
  }

  return (
    <div className="flex flex-col min-h-full bg-slate-50/40">
      <Navbar
        title="Gestión de Roles"
        subtitle="Cambia los roles de los usuarios directamente desde aquí"
      />

      <div className="flex-1 p-6 space-y-5 animate-fade-in">

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-3 gap-4">
          {(
            [
              { role: 'customer', label: 'Clientes', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100' },
              { role: 'agent', label: 'Agentes', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
              { role: 'admin', label: 'Admins', color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-100' },
            ] as const
          ).map((s) => (
            <div
              key={s.role}
              className={`bg-white rounded-xl border ${s.border} shadow-sm p-4 flex items-center gap-3`}
            >
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <span className={`text-lg font-bold ${s.color}`}>{counts[s.role]}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{s.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {Math.round((counts[s.role] / (all.length || 1)) * 100)}% del total
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Users table ── */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-950">Usuarios del Sistema</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {all.length} usuarios registrados — los cambios se aplican inmediatamente
              </p>
            </div>

            {/* Info badge */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg">
              <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-amber-700 font-medium">El email viene del login — no está en profiles</span>
            </div>
          </div>

          {all.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              No hay usuarios registrados.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/60">
                  <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-10">#</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Usuario</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rol Actual → Nuevo Rol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {all.map((profile, idx) => {
                  const initial = (profile.full_name ?? '?').charAt(0).toUpperCase()
                  const avatarColors: Record<UserRole, string> = {
                    customer: 'bg-blue-500',
                    agent: 'bg-emerald-600',
                    admin: 'bg-violet-600',
                  }

                  return (
                    <tr
                      key={profile.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      {/* Row number */}
                      <td className="px-5 py-4">
                        <span className="text-xs text-slate-400 font-mono">{idx + 1}</span>
                      </td>

                      {/* Avatar + name */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full ${avatarColors[profile.role]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                          >
                            {initial}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {profile.full_name ?? <span className="text-slate-400 italic">Sin nombre</span>}
                            </p>
                            <p className="text-[10px] text-slate-400 capitalize">{profile.role}</p>
                          </div>
                        </div>
                      </td>

                      {/* ID */}
                      <td className="px-4 py-4">
                        <span
                          className="text-xs text-slate-400 font-mono select-all"
                          title={profile.id}
                        >
                          {profile.id.slice(0, 8)}…{profile.id.slice(-4)}
                        </span>
                      </td>

                      {/* Role selector dropdown */}
                      <td className="px-4 py-4">
                        <RoleSelector
                          userId={profile.id}
                          currentRole={profile.role}
                          currentAdminId={user.id}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  )
}
