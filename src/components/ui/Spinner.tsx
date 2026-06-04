interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-[3px]',
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <span
      className={`inline-block rounded-full border-slate-600 border-t-indigo-400 animate-spin ${sizeMap[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}

export function PageSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-slate-700" />
        <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-t-indigo-400 animate-spin" />
      </div>
      <p className="text-sm text-slate-500 animate-pulse">Loading...</p>
    </div>
  )
}
