import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  isLoading?: boolean
  leftIcon?: React.ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20',
  secondary:
    'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-350 shadow-sm',
  ghost:
    'bg-transparent hover:bg-slate-50 text-slate-600 hover:text-slate-900',
  danger:
    'bg-red-50 hover:bg-red-100/80 text-red-600 border border-red-200/50 hover:border-red-200',
  success:
    'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-250/50 hover:border-emerald-250',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-md',
  md: 'px-4 py-2.5 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`btn-base font-medium transition-all duration-200 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Spinner size="sm" />
        ) : (
          leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
