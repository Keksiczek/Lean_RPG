"use client";

import { useEffect, useRef, useState } from "react";

import { useGamification } from "@/hooks/useGamification";

export type AchievementDto = {
  id: number;
  code: string;
  name: string;
  description: string;
  icon?: string | null;
  type: string;
  difficulty?: string;
  category?: string;
  xpReward: number;
  userProgress: { progress: number; completedAt?: Date | null };
};

export function AchievementProgress() {
  const [achievements, setAchievements] = useState<AchievementDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { onAchievementUnlocked } = useGamification();
  const previousAchievementsRef = useRef<AchievementDto[]>([]);

  useEffect(() => {
    async function fetchAchievements() {
      try {
        const res = await fetch("/api/gamification/achievements");
        if (!res.ok) {
          throw new Error("Failed to fetch achievements");
        }
        const apiData = (await res.json()) as AchievementDto[];
        const parsed = apiData.map((achievement) => ({
          ...achievement,
          userProgress: {
            ...achievement.userProgress,
            completedAt: achievement.userProgress.completedAt
              ? new Date(achievement.userProgress.completedAt)
              : null,
          },
        }));
        const newlyCompleted = parsed.filter(
          (achievement) =>
            achievement.userProgress.completedAt &&
            !previousAchievementsRef.current.find(
              (prev) => prev.id === achievement.id && prev.userProgress.completedAt,
            ),
        );

        newlyCompleted.forEach((achievement) => onAchievementUnlocked(achievement));

        setAchievements(parsed);
        previousAchievementsRef.current = parsed;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchAchievements();
  }, [onAchievementUnlocked]);

  if (loading) return <div>Loading achievements...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {achievements.map((achievement) => (
        <div
          key={achievement.id}
          className="flex h-full flex-col rounded-lg border border-slate-200 p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold">{achievement.name}</h4>
              <p className="text-sm text-slate-500">{achievement.description}</p>
            </div>
            <span className="text-sm text-slate-500">{achievement.userProgress.progress}%</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded bg-slate-100">
            <div
              className="h-2 bg-green-500"
              style={{ width: `${Math.min(achievement.userProgress.progress, 100)}%` }}
            />
          </div>
          {achievement.userProgress.completedAt && (
            <p className="mt-3 text-sm text-green-600">Completed</p>
          )}
        </div>
      ))}
    </div>
  );
}
