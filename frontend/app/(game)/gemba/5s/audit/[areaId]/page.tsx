'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { fetchFiveSSetting, startFiveSAudit } from '@/lib/api/fiveS';
import type { FiveSSetting } from '@/lib/api/fiveS';

export default function AuditBriefingPage() {
  const router = useRouter();
  const params = useParams();
  const areaId = Number(params?.areaId);
  const [setting, setSetting] = useState<FiveSSetting | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const checklist = await fetchFiveSSetting(areaId);
        setSetting(checklist);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    if (areaId) {
      load();
    }
  }, [areaId]);

  const handleStart = async () => {
    try {
      setLoading(true);
      const audit = await startFiveSAudit(areaId);
      router.push(`/gemba/5s/audit/${audit.id}/checklist`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card title="Audit briefing" description="Připrav se na 5S audit">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {setting ? (
          <div className="space-y-2 text-sm text-gray-800">
            <p className="font-semibold">{setting.name}</p>
            <p>Time limit: {Math.round(setting.timeLimit / 60)} min</p>
            <p>Passing score: {setting.passingScore}</p>
            <p className="text-gray-600">Max problems to log: {setting.maxProblems}</p>
            <Button onClick={handleStart} disabled={loading} className="mt-3">
              {loading ? 'Starting...' : 'Start audit'}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-gray-600">Loading checklist...</p>
        )}
      </Card>
    </div>
  );
}
