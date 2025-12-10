'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { fetchFiveSLeaderboard } from '@/lib/api/fiveS';

export default function FiveSLeaderboardPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetchFiveSLeaderboard();
        setEntries(response.leaderboard ?? []);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">5S Leaderboard</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Card title="Top auditors" description="Podle průměrného skóre">
        <div className="space-y-2 text-sm text-gray-800">
          {entries.map((entry, index) => (
            <div key={entry.userId} className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2">
              <div>
                <p className="font-semibold text-gray-900">
                  {index + 1}. {entry.name}
                </p>
                <p className="text-xs text-gray-600">Audits: {entry.auditCount} · Avg: {entry.averageScore}</p>
              </div>
              <span className="text-blue-700">{entry.xp} XP</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
