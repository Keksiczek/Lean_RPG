'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchAreas } from '@/lib/api/gemba';
import { fetchFiveSLeaderboard, fetchFiveSSetting, fetchAuditHistory } from '@/lib/api/fiveS';
import type { FiveSSetting } from '@/lib/api/fiveS';
import { useAuth } from '@/lib/auth-context';

export default function FiveSHubPage() {
  const { user } = useAuth();
  const [areas, setAreas] = useState<{ id: number; name: string; locked?: boolean }[]>([]);
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [setting, setSetting] = useState<FiveSSetting | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const areaData = await fetchAreas();
        setAreas(areaData);
        const areaId = areaData.find((a) => !a.locked)?.id ?? areaData[0]?.id;
        if (areaId) {
          setSelectedArea(areaId);
          const checklist = await fetchFiveSSetting(areaId);
          setSetting(checklist);
        }
        if (user) {
          const historyResponse = await fetchAuditHistory(user.id);
          setHistory(historyResponse.audits ?? []);
        }
        const leaderboardResponse = await fetchFiveSLeaderboard();
        setLeaderboard(leaderboardResponse.leaderboard ?? []);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    load();
  }, [user]);

  const recentAudit = useMemo(() => history[0], [history]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">🧹 5S Audit Hub</h1>
          <p className="text-sm text-gray-600">Spusť rychlý 5S audit a sleduj svůj progres.</p>
        </div>
        {selectedArea && (
          <Link href={`/gemba/5s/audit/${selectedArea}`} className="inline-flex">
            <Button>Start audit</Button>
          </Link>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Select area" description="Vyber pracoviště pro audit">
          <div className="space-y-2">
            {areas.map((area) => (
              <button
                key={area.id}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm ${
                  selectedArea === area.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                } ${area.locked ? 'opacity-50' : ''}`}
                disabled={area.locked}
                onClick={async () => {
                  setSelectedArea(area.id);
                  try {
                    const checklist = await fetchFiveSSetting(area.id);
                    setSetting(checklist);
                  } catch (err) {
                    setError((err as Error).message);
                  }
                }}
              >
                <span>{area.name}</span>
                {area.locked ? <span className="text-xs text-gray-500">Locked</span> : <span>➡️</span>}
              </button>
            ))}
          </div>
        </Card>

        <Card title="Checklist preview" description="Poslední načtený checklist">
          {setting ? (
            <div className="space-y-2 text-sm text-gray-800">
              <p className="font-semibold">{setting.name}</p>
              <p>Time limit: {Math.round(setting.timeLimit / 60)} min</p>
              <p>Passing score: {setting.passingScore}</p>
              <p className="text-gray-600">Otázky: {setting.sortCriteria.length * 5}+</p>
              <Link href={`/gemba/5s/audit/${selectedArea ?? setting.areaId}`} className="text-blue-700">
                View briefing ↗
              </Link>
            </div>
          ) : (
            <p className="text-sm text-gray-600">No checklist found for this area.</p>
          )}
        </Card>

        <Card title="Recent audit" description="Tvůj poslední výsledek">
          {recentAudit ? (
            <div className="space-y-2 text-sm text-gray-800">
              <p className="font-semibold">{recentAudit.area?.name ?? 'Area'}</p>
              <p>Score: {recentAudit.totalScore ?? '—'}/100</p>
              <p>Status: {recentAudit.status}</p>
              <Link href={`/gemba/5s/audit/${recentAudit.id}/result`} className="text-blue-700">
                Detail výsledku
              </Link>
            </div>
          ) : (
            <p className="text-sm text-gray-600">Ještě nemáš žádný 5S audit.</p>
          )}
        </Card>
      </div>

      <Card title="Leaderboard" description="Top 5S auditoři">
        <div className="space-y-2">
          {leaderboard.slice(0, 5).map((entry, index) => (
            <div key={entry.userId} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
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
        <div className="mt-3 text-right text-sm">
          <Link href="/gemba/5s/leaderboard" className="text-blue-700">
            View full leaderboard
          </Link>
        </div>
      </Card>
    </div>
  );
}
