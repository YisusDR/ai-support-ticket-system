import { type HTMLAttributes, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'ai'
  noPadding?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', noPadding = false, children, className = '', ...props }, ref) => {
    const base = 'rounded-xl border transition-all duration-200'

    const variants = {
      default: 'glass-card',
      elevated:
        'bg-white border-slate-100 shadow-sm shadow-slate-100/80',
      ai: 'border-emerald-200/50 shadow-lg shadow-emerald-500/5',
    }

    const aiBackground =
      variant === 'ai'
        ? 'bg-gradient-to-br from-emerald-50/80 via-white to-slate-50/80'
        : ''

    return (
      <div
        ref={ref}
        className={`${base} ${variants[variant]} ${aiBackground} ${noPadding ? '' : 'p-6'} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
