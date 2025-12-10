"use client";

import { useEffect, useState } from "react";
import type { ProgressionDashboardData } from "@/types/skills";

export function ProgressionDashboard() {
  const [data, setData] = useState<ProgressionDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchDashboard() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/progression/dashboard");
        if (!res.ok) {
          throw new Error("Failed to fetch progression");
        }
        const payload = (await res.json()) as ProgressionDashboardData;
        if (mounted) {
          setData(payload);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div className="rounded-lg bg-white p-4 shadow-sm">Loading progression...</div>;
  if (error)
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        <p className="font-semibold">Unable to load progression</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  if (!data) return <div className="rounded-lg bg-white p-4 shadow-sm">No progression data found</div>;

  return (
    <div className="space-y-4 rounded-lg bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Current tier</p>
          <h3 className="text-2xl font-semibold text-gray-900">Tier {data.currentTier} / 3</h3>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Active skills</p>
          <p className="text-lg font-semibold text-gray-900">{data.activeSkillCount}</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{data.totalXp} XP</span>
          <span>{data.xpToNextTier > 0 ? `${data.xpToNextTier} XP to next tier` : "Tier maxed"}</span>
        </div>
        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-indigo-500"
            style={{ width: `${Math.min(100, Math.round(data.tierProgress * 100))}%` }}
          ></div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-gray-500">Unlocked skills</p>
          <p className="text-xl font-semibold text-gray-900">{data.unlockedSkillCount}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-gray-500">Active loadout</p>
          <p className="text-xl font-semibold text-gray-900">{data.activeSkillCount} / 3</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-gray-500">Next tier</p>
          <p className="text-xl font-semibold text-gray-900">Tier {data.nextTier}</p>
        </div>
      </div>
    </div>
  );
}
