'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { fetchAuditHistory } from '@/lib/api/fiveS';
import { useAuth } from '@/lib/auth-context';

export default function FiveSHistoryPage() {
  const { user } = useAuth();
  const [audits, setAudits] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const history = await fetchAuditHistory(user.id);
        setAudits(history.audits ?? []);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    load();
  }, [user]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My 5S audits</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="space-y-2">
        {audits.map((audit) => (
          <Card key={audit.id} title={audit.setting?.name ?? '5S audit'} description={audit.area?.name}>
            <div className="flex items-center justify-between text-sm text-gray-800">
              <div>
                <p>Score: {audit.totalScore ?? '—'}/100</p>
                <p>Status: {audit.status}</p>
              </div>
              <Link href={`/gemba/5s/audit/${audit.id}/result`} className="text-blue-700">
                View result
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
