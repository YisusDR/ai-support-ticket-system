import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ─────────────────────────────────────────────────────────────────────────────
// Route → allowed roles map (optimistic check — no DB queries here)
// Real DB-backed protection lives in the server layout components.
// ─────────────────────────────────────────────────────────────────────────────
type Role = 'customer' | 'agent' | 'admin'

interface RouteRule {
  prefix: string
  allowedRoles: Role[]
}

const ROUTE_RULES: RouteRule[] = [
  // Customer-only paths
  { prefix: '/customer', allowedRoles: ['customer'] },

  // Agent + Admin paths
  { prefix: '/agent',   allowedRoles: ['agent', 'admin'] },
  { prefix: '/tickets', allowedRoles: ['agent', 'admin'] },

  // Admin-only paths
  { prefix: '/admin',   allowedRoles: ['admin'] },
]

// Routes that are always publicly accessible (no auth needed)
const PUBLIC_PATHS = ['/login', '/register', '/unauthorized']

// ─────────────────────────────────────────────────────────────────────────────
// Proxy
// ─────────────────────────────────────────────────────────────────────────────
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session — IMPORTANT: no logic between createServerClient and getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // ── Public paths — never redirect ──────────────────────────────────────────
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  // Authenticated user visiting auth pages → redirect home (role-based)
  if (isPublic && pathname !== '/unauthorized' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // ── Determine which rule applies ───────────────────────────────────────────
  const matchedRule = ROUTE_RULES.find((rule) =>
    pathname.startsWith(rule.prefix)
  )

  if (!matchedRule) {
    // Unprotected route — pass through
    return supabaseResponse
  }

  // ── Not authenticated → login ──────────────────────────────────────────────
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // ── Role check (optimistic — from JWT metadata if available) ───────────────
  // Supabase stores app_metadata on the user object; fall through to layout
  // guard for the secure DB-backed check.
  const jwtRole =
    (user.app_metadata?.role as Role | undefined) ??
    (user.user_metadata?.role as Role | undefined)

  if (jwtRole && !matchedRule.allowedRoles.includes(jwtRole)) {
    const url = request.nextUrl.clone()
    url.pathname = '/unauthorized'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
