import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication — AI Support Ticket System',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50/50">
      {/* Light Ambient Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Minimalist Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center shadow-lg shadow-slate-950/10 mb-4 transition-transform hover:scale-105 duration-200">
            <svg
              className="w-6 h-6 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight leading-none">
            AI <span className="text-emerald-600">Support</span>
          </h1>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-2">
            Ticket System
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
