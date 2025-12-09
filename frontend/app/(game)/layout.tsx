"use client";

import { Sidebar } from '@/components/layout/sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-50">
        <div className="w-64 shrink-0">
          <Sidebar />
        </div>
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-6xl space-y-6">
            <header className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
              <div>
                <p className="text-sm text-gray-500">Lean RPG</p>
                <h1 className="text-xl font-semibold text-gray-900">Herní panel</h1>
              </div>
            </header>
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
