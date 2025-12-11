'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/src/store/authStore'

export function Navbar() {
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  return (
    <nav className="bg-blue-600 text-white px-6 py-4 shadow-lg">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/">
          <h1 className="text-2xl font-bold cursor-pointer">🚀 Lean RPG</h1>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm">
            Welcome, <strong>{user?.username ?? 'Player'}</strong>
          </span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
