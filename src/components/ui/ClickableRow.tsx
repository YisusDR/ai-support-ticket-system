'use client'

import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

interface ClickableRowProps {
  href: string
  children: ReactNode
  className?: string
}

/**
 * A <tr> that navigates to `href` on click.
 * Replaces the deprecated legacyBehavior pattern of wrapping <tr> with <Link>.
 */
export function ClickableRow({ href, children, className = '' }: ClickableRowProps) {
  const router = useRouter()

  return (
    <tr
      onClick={() => router.push(href)}
      className={`hover:bg-slate-50/80 cursor-pointer transition-colors duration-100 group ${className}`}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          router.push(href)
        }
      }}
    >
      {children}
    </tr>
  )
}
