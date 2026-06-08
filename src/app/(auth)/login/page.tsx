'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setIsLoading(false)
      return
    }

    // Fetch profile to determine role-based redirect
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'customer') {
        router.push('/customer')
      } else {
        router.push('/agent')
      }
      router.refresh()
    }

    setIsLoading(false)
  }

  return (
    <div className="animate-slide-up">
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-100/50 p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-950 tracking-tight">Welcome back</h2>
          <p className="text-sm text-slate-500 mt-1">
            Sign in to your account to continue
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <Input
            id="email"
            type="email"
            label="Email address"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="focus:ring-emerald-500/20 focus:border-emerald-500"
          />

          <Input
            id="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="focus:ring-emerald-500/20 focus:border-emerald-500"
          />

          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm animate-fade-in">
              <svg className="w-4 h-4 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-500/10 focus:ring-emerald-500/20"
          >
            Sign In
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
