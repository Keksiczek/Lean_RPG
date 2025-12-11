import { redirect } from 'next/navigation'
import { Navbar } from '@/src/components/Navbar'
import { GameSidebar } from '@/src/components/GameSidebar'
import { StatsBar } from '@/src/components/StatsBar'
import { getSession } from '@/src/utils/auth'
import type { ReactNode } from 'react'

export default async function GameLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await getSession()
  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <StatsBar />
      <div className="flex flex-1 overflow-hidden">
        <GameSidebar />
        <main className="flex-1 overflow-auto bg-white p-6">{children}</main>
      </div>
    </div>
  )
}
