import { useCallback } from "react";
import { toast } from "sonner";

export function useGamification() {
  const onAchievementUnlocked = useCallback((achievement: { name: string; xpReward?: number }) => {
    toast.success(`🎉 Achievement unlocked: ${achievement.name}!`, {
      description: achievement.xpReward ? `+${achievement.xpReward} XP` : undefined,
    });
  }, []);

  const onBadgeUnlocked = useCallback((badge: { name: string; icon?: string | null }) => {
    toast.success(`${badge.icon || "🏆"} New badge: ${badge.name}!`, {
      description: "Check your profile to see it",
    });
  }, []);

  return { onAchievementUnlocked, onBadgeUnlocked };
}
