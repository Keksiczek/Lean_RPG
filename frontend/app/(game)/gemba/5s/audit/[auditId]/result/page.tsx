'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { fetchAudit } from '@/lib/api/fiveS';
import type { FiveSAudit } from '@/lib/api/fiveS';

export default function AuditResultPage() {
  const params = useParams();
  const auditId = Number(params?.auditId);
  const [audit, setAudit] = useState<FiveSAudit | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const detail = await fetchAudit(auditId);
        setAudit(detail);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    if (auditId) load();
  }, [auditId]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">✅ Audit complete</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {audit ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Card title="Score" description={audit.setting?.name ?? '5S Audit'}>
            <p className="text-3xl font-bold text-blue-700">{audit.totalScore ?? '—'}/100</p>
            <p className="text-sm text-gray-600">Status: {audit.status}</p>
            <p className="text-sm text-gray-600">Time: {audit.timeSpent ? `${audit.timeSpent}s` : 'n/a'}</p>
            <p className="text-sm text-gray-600">XP: +{audit.xpGain}</p>
            <p className="text-sm text-gray-600">Points: +{audit.pointsGain}</p>
            {audit.badgeEarned && <p className="text-sm text-emerald-700">Badge: {audit.badgeEarned}</p>}
          </Card>
          <Card title="Breakdown" description="Kategorie">
            <ul className="space-y-1 text-sm text-gray-800">
              <li>Sort: {audit.sortScore ?? '—'}/20</li>
              <li>Set in order: {audit.orderScore ?? '—'}/20</li>
              <li>Shine: {audit.shineScore ?? '—'}/20</li>
              <li>Standardize: {audit.standardizeScore ?? '—'}/20</li>
              <li>Sustain: {audit.sustainScore ?? '—'}/20</li>
            </ul>
          </Card>
        </div>
      ) : (
        <p className="text-sm text-gray-600">Loading audit...</p>
      )}

      {audit?.mainIssue && (
        <Card title="Top issue" description="Největší problém">
          <p className="text-sm text-gray-800">{audit.mainIssue}</p>
        </Card>
      )}

      {audit?.aiFeedback && (
        <Card title="AI feedback" description="Doporučení">
          <p className="text-sm text-gray-800">{audit.aiFeedback}</p>
        </Card>
      )}

      {audit?.problems && audit.problems.length > 0 && (
        <Card title="Logged problems" description="Zachycené issue">
          <div className="space-y-2 text-sm text-gray-800">
            {audit.problems.map((problem) => (
              <div key={problem.id} className="rounded-md border border-gray-200 px-3 py-2">
                <p className="font-semibold">{problem.description}</p>
                <p className="text-xs text-gray-600">
                  {problem.position} · {problem.category} · {problem.severity}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
