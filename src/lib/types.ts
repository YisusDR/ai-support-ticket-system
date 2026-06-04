// ============================================================
// Database Types — mirrors Supabase schema exactly
// ============================================================

export type UserRole = 'customer' | 'agent' | 'admin'
export type TicketStatus = 'open' | 'in_progress' | 'resolved'
export type TicketPriority = 'low' | 'medium' | 'high'

export interface Profile {
  id: string
  full_name: string | null
  role: UserRole
}

export interface Ticket {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  customer_id: string
  assigned_to: string | null
  ai_summary: string | null
  ai_suggestions: string | null
  created_at: string
  updated_at: string
  // Optional join fields
  profiles?: Profile | null
}

export interface Comment {
  id: string
  ticket_id: string
  user_id: string
  message: string
  created_at: string
  // Optional join fields
  profiles?: Pick<Profile, 'id' | 'full_name' | 'role'> | null
}

// ============================================================
// UI / Form helpers
// ============================================================

export type CreateTicketInput = {
  title: string
  description: string
}

export type CreateCommentInput = {
  ticket_id: string
  message: string
}
