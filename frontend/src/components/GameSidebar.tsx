'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function GameSidebar() {
  const pathname = usePathname()

  const links = [
    { href: '/dashboard', label: '📊 Dashboard', icon: '📊' },
    { href: '/audit', label: '📋 5S Audit', icon: '📋' },
    { href: '/ishikawa', label: '🎣 Ishikawa', icon: '🎣' },
    { href: '/skills', label: '⭐ Skills', icon: '⭐' },
    { href: '/leaderboard', label: '🏆 Leaderboard', icon: '🏆' },
  ]

  return (
    <aside className="w-64 bg-gray-100 border-r border-gray-300 overflow-y-auto">
      <div className="p-6 space-y-2">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            <div
              className={`p-3 rounded cursor-pointer transition ${
                pathname === link.href
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              {link.icon} {link.label}
            </div>
          </Link>
        ))}
      </div>
    </aside>
  )
}
