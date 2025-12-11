import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/src/components/Providers'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Lean RPG',
  description: 'Gamified Lean training',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="cs">
      <body className="bg-gray-50 text-gray-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
