interface NavbarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Navbar({ title, subtitle, actions }: NavbarProps) {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-sm sticky top-0 z-10">
      <div>
        <h1 className="text-lg font-semibold text-slate-100 leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-xs text-slate-500 leading-tight mt-0.5">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  )
}
