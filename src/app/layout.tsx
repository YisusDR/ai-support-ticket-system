import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Support Ticket System',
  description: 'Intelligent customer support powered by AI — manage, track and resolve tickets efficiently.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className="h-full flex flex-col">{children}</body>
    </html>
  )
}
