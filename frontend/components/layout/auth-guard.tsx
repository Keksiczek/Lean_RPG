"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user && !loading) {
      router.replace('/login');
    }
  }, [user, loading, ready, router]);

  if (!ready || loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-700">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Ověřujeme přihlášení...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
