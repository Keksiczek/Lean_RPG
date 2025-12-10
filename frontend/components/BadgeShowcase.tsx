"use client";

import { useEffect, useState } from "react";

import { BadgeCard } from "./BadgeCard";

export type BadgeDto = {
  id: number;
  code: string;
  name: string;
  description: string;
  icon?: string | null;
  color?: string | null;
  isUnlocked: boolean;
  unlockedAt?: string | null;
};

export function BadgeShowcase() {
  const [badges, setBadges] = useState<BadgeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBadges() {
      try {
        const res = await fetch("/api/gamification/badges");
        if (!res.ok) {
          throw new Error("Failed to fetch badges");
        }
        const data = (await res.json()) as BadgeDto[];
        setBadges(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchBadges();
  }, []);

  if (loading) return <div>Loading badges...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  const unlockedBadges = badges.filter((badge) => badge.isUnlocked);
  const lockedBadges = badges.filter((badge) => !badge.isUnlocked);

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Unlocked ({unlockedBadges.length})</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
          {unlockedBadges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} unlocked />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Locked ({lockedBadges.length})</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 opacity-70">
          {lockedBadges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      </section>
    </div>
  );
}
