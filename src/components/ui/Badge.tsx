import type { TicketStatus, TicketPriority } from '@/lib/types'

interface StatusBadgeProps {
  status: TicketStatus
}

interface PriorityBadgeProps {
  priority: TicketPriority
}

interface RoleBadgeProps {
  role: string
}

const statusConfig: Record<TicketStatus, { label: string; classes: string }> = {
  open: {
    label: 'Open',
    classes: 'bg-blue-50 text-blue-700 border-blue-200/80',
  },
  in_progress: {
    label: 'In Progress',
    classes: 'bg-amber-50 text-amber-700 border-amber-200/80',
  },
  resolved: {
    label: 'Resolved',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  },
}

const priorityConfig: Record<TicketPriority, { label: string; classes: string; dot: string }> = {
  high: {
    label: 'High',
    classes: 'bg-emerald-600 text-white border-emerald-700',
    dot: 'bg-white/60',
  },
  medium: {
    label: 'Medium',
    classes: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  low: {
    label: 'Low',
    classes: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    dot: 'bg-emerald-400',
  },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.classes}`}
    >
      {config.label}
    </span>
  )
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority]
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const classes =
    role === 'admin'
      ? 'bg-violet-50 text-violet-700 border-violet-200/80'
      : role === 'agent'
      ? 'bg-slate-100 text-slate-700 border-slate-200'
      : 'bg-slate-50 text-slate-600 border-slate-100'

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${classes}`}
    >
      {role}
    </span>
  )
}
