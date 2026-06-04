import type { TicketStatus, TicketPriority } from '@/lib/types'

type BadgeVariant = 'status' | 'priority' | 'role'

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
    classes: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  },
  in_progress: {
    label: 'In Progress',
    classes: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  resolved: {
    label: 'Resolved',
    classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
}

const priorityConfig: Record<TicketPriority, { label: string; classes: string; dot: string }> = {
  high: {
    label: 'High',
    classes: 'bg-red-500/15 text-red-400 border-red-500/30',
    dot: 'bg-red-400',
  },
  medium: {
    label: 'Medium',
    classes: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-400',
  },
  low: {
    label: 'Low',
    classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.classes}`}
    >
      {config.label}
    </span>
  )
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority]
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const classes =
    role === 'admin'
      ? 'bg-violet-500/15 text-violet-400 border-violet-500/30'
      : role === 'agent'
      ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
      : 'bg-slate-700/50 text-slate-400 border-slate-600/50'

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${classes}`}
    >
      {role}
    </span>
  )
}
