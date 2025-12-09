"use client";

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { LogOut, UserRound } from 'lucide-react';

export function UserNav() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <UserRound className="h-5 w-5 text-primary" />
        </div>
        <div className="text-sm">
          <div className="font-semibold text-gray-900">{user?.name ?? 'Neznámý uživatel'}</div>
          <div className="text-gray-500">{user?.email ?? 'Nepřihlášen'}</div>
        </div>
      </div>
      <Button variant="ghost" onClick={handleLogout} className="text-sm text-red-500 hover:bg-red-50">
        <LogOut className="mr-2 h-4 w-4" /> Odhlásit
      </Button>
    </div>
  );
}
