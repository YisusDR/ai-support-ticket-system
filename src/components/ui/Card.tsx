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
        'bg-slate-800/80 backdrop-blur-sm border-slate-700/60 shadow-xl shadow-black/20',
      ai: 'border-indigo-500/25 shadow-lg shadow-indigo-500/10',
    }

    const aiBackground =
      variant === 'ai'
        ? 'bg-gradient-to-br from-indigo-950/80 via-slate-900/90 to-violet-950/80 backdrop-blur-sm'
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
