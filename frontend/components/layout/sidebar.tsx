"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ListChecks, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserNav } from './user-nav';

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/quests', label: 'Úkoly', icon: ListChecks },
  { href: '/areas', label: 'Lokace', icon: Map }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col border-r border-gray-200 bg-white">
      <div className="px-6 py-5">
        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <span className="h-3 w-3 rounded-full bg-primary" />
          Lean RPG
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-blue-50',
                active && 'bg-blue-50 text-primary'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-100 p-4">
        <UserNav />
      </div>
    </aside>
  );
}
