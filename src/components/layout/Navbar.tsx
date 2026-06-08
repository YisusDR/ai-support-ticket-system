'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

interface NavbarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Navbar({ title, subtitle, actions }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setEmail(user.email ?? '')
          const { data } = await supabase
            .from('profiles')
            .select('id, full_name, role')
            .eq('id', user.id)
            .single()
          
          if (data) {
            setProfile(data as Profile)
          }
        }
      } catch (error) {
        console.error('Error loading profile in navbar:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadUserProfile()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const userInitial = profile?.full_name?.charAt(0).toUpperCase() || email?.charAt(0).toUpperCase() || 'U'
  const userDisplayName = profile?.full_name || email?.split('@')[0] || 'User'

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-slate-100 bg-white sticky top-0 z-30">
      <div>
        <h1 className="text-base font-semibold text-slate-950 leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-xs text-slate-500 leading-tight mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {actions && <div className="flex items-center gap-3">{actions}</div>}

        {/* User Profile Avatar Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
            id="user-avatar-button"
            aria-label="User menu"
          >
            {userInitial}
          </button>

          {isOpen && (
            <>
              {/* Invisible backdrop to handle click-outside */}
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                onClick={() => setIsOpen(false)}
              />
              
              <div 
                className="absolute right-0 mt-2 w-64 bg-white border border-slate-100 rounded-xl shadow-lg py-2 z-50 animate-fade-in"
                role="menu"
              >
                {/* Profile header summary */}
                <div className="px-4 py-3 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 text-sm font-semibold">
                      {userInitial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {userDisplayName}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {email}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 capitalize">
                      {profile?.role || 'User'}
                    </span>
                  </div>
                </div>

                {/* Dropdown Menu Items */}
                <div className="py-1">
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    role="menuitem"
                  >
                    <svg className="w-4 h-4 mr-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Perfil
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    role="menuitem"
                  >
                    <svg className="w-4 h-4 mr-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Configuración de Cuenta
                  </Link>
                </div>

                <div className="border-t border-slate-50 py-1">
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      handleLogout()
                    }}
                    className="flex w-full items-center text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer font-medium"
                    role="menuitem"
                  >
                    <svg className="w-4 h-4 mr-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
