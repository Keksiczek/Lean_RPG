"use client";

import { useEffect, useState } from "react";

export type PlayerComparisonDto = {
  user1: { name: string; skillProgression: { totalXp: number; currentTier: number } };
  user2: { name: string; skillProgression: { totalXp: number; currentTier: number } };
  xpDifference: number;
  rankDifference: number;
  skillsCommon: number;
};

export function PlayerComparison({ userId1, userId2 }: { userId1: number; userId2: number }) {
  const [comparison, setComparison] = useState<PlayerComparisonDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchComparison() {
      try {
        const res = await fetch(`/api/gamification/players/${userId1}/compare/${userId2}`);
        if (!res.ok) {
          throw new Error("Failed to fetch comparison");
        }
        const data = (await res.json()) as PlayerComparisonDto;
        setComparison(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchComparison();
  }, [userId1, userId2]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!comparison) return <div>No comparison found</div>;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-slate-200 p-4 shadow-sm">
        <h3 className="text-lg font-semibold">{comparison.user1.name}</h3>
        <p className="text-sm text-slate-600">XP: {comparison.user1.skillProgression.totalXp}</p>
        <p className="text-sm text-slate-600">Tier: {comparison.user1.skillProgression.currentTier}</p>
      </div>

      <div className="rounded-lg border border-slate-200 p-4 shadow-sm">
        <h3 className="text-lg font-semibold">{comparison.user2.name}</h3>
        <p className="text-sm text-slate-600">XP: {comparison.user2.skillProgression.totalXp}</p>
        <p className="text-sm text-slate-600">Tier: {comparison.user2.skillProgression.currentTier}</p>
      </div>

      <div className="rounded-lg border border-slate-200 p-4 shadow-sm sm:col-span-2">
        <p className="text-sm text-slate-700">
          XP Difference: {comparison.xpDifference} (
          {comparison.xpDifference > 0 ? `${comparison.user1.name} ahead` : `${comparison.user2.name} ahead`})
        </p>
        <p className="text-sm text-slate-700">Common Skills: {comparison.skillsCommon}</p>
        <p className="text-sm text-slate-700">Rank Gap: {comparison.rankDifference}</p>
      </div>
    </div>
  );
}
