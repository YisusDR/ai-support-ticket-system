'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Profile } from '@/lib/types'

interface SidebarProps {
  profile: Profile
}

// ── Nav link definitions ───────────────────────────────────────────────────
interface NavLink { href: string; label: string; icon: React.ReactNode }

const ICON = {
  home: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  ticket: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  plus: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  list: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  ),
  chart: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  shield: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
}

const customerLinks: NavLink[] = [
  { href: '/customer', label: 'Dashboard', icon: ICON.home },
  { href: '/customer/new-ticket', label: 'Nuevo Ticket', icon: ICON.plus },
  { href: '/customer/my-tickets', label: 'Mis Tickets', icon: ICON.ticket },
]

const agentLinks: NavLink[] = [
  { href: '/agent', label: 'Dashboard', icon: ICON.home },
  { href: '/tickets', label: 'Todos los Tickets', icon: ICON.list },
]

const adminLinks: NavLink[] = [
  { href: '/admin/metrics', label: 'Métricas', icon: ICON.chart },
  { href: '/admin/roles', label: 'Gestión de Roles', icon: ICON.shield },
]

// ── Component ──────────────────────────────────────────────────────────────
export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()

  const mainLinks =
    profile.role === 'customer'
      ? customerLinks
      : agentLinks

  const isActive = (href: string) => {
    if (href === '/tickets') return pathname === '/tickets' || pathname.startsWith('/tickets/')
    if (href === '/customer/my-tickets') return pathname === '/customer/my-tickets'
    if (href === '/customer/new-ticket') return pathname === '/customer/new-ticket'
    if (href === '/customer') return pathname === '/customer'
    if (href === '/agent') return pathname === '/agent'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const NavItem = ({ link }: { link: NavLink }) => {
    const active = isActive(link.href)
    return (
      <Link
        href={link.href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
          active
            ? 'text-emerald-700 bg-emerald-50/70 border border-emerald-500/10 font-semibold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        }`}
      >
        <span className={`flex-shrink-0 ${active ? 'text-emerald-600' : 'text-emerald-600'}`}>
          {link.icon}
        </span>
        <span>{link.label}</span>
      </Link>
    )
  }

  return (
    <aside className="w-64 flex-shrink-0 h-screen sticky top-0 flex flex-col bg-white border-r border-slate-100">
      {/* Logo */}
      <div className="p-6 border-b border-slate-100">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center shadow-sm transition-transform duration-200 group-hover:scale-105">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-950 leading-tight">
              AI <span className="text-emerald-600">Support</span>
            </p>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none mt-0.5">
              SaaS Portal
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-3">
          General
        </p>
        {mainLinks.map((link) => (
          <NavItem key={link.href} link={link} />
        ))}

        {/* Admin section — only for admins */}
        {profile.role === 'admin' && (
          <>
            <div className="pt-4 pb-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3">
                Administración
              </p>
            </div>
            {adminLinks.map((link) => (
              <NavItem key={link.href} link={link} />
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/30">
        <div className="flex items-center gap-2 px-1">
          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-[10px] font-bold flex-shrink-0">
            {(profile.full_name ?? 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-700 truncate">{profile.full_name ?? 'User'}</p>
            <p className="text-[10px] text-slate-400 capitalize">{profile.role}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
