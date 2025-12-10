import prisma from "../lib/prisma.js";
import logger from "../lib/logger.js";
import { progressionService } from "./progressionService.js";

export class BadgeService {
  async listBadgesForUser(userId: number) {
    const badges = await prisma.badge.findMany({
      where: { active: true },
      include: {
        userBadges: {
          where: { userId },
          select: { unlockedAt: true },
        },
      },
      orderBy: [
        { tier: "desc" },
        { rarity: "desc" },
        { name: "asc" },
      ],
    });

    return badges.map((badge) => ({
      ...badge,
      isUnlocked: badge.userBadges.length > 0,
      unlockedAt: badge.userBadges[0]?.unlockedAt ?? null,
    }));
  }

  async checkAndUnlockBadges(userId: number) {
    const progression = await prisma.skillProgression.findUnique({ where: { userId } });
    const stats = await prisma.leaderboardStats.findUnique({ where: { userId } });
    const badges = await prisma.badge.findMany({ where: { active: true } });

    const unlocked = [] as typeof badges;

    for (const badge of badges) {
      const alreadyUnlocked = await prisma.userBadge.findUnique({
        where: { userId_badgeId: { userId, badgeId: badge.id } },
      });

      if (alreadyUnlocked) continue;

      const shouldUnlock = this.checkUnlockConditions(
        badge,
        progression,
        stats,
      );

      if (shouldUnlock) {
        await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });

        if (badge.xpReward > 0) {
          await progressionService.addXp(userId, badge.xpReward);
        }

        unlocked.push(badge);
        logger.info({ userId, badgeId: badge.id }, "Badge unlocked");
      }
    }

    return unlocked;
  }

  private checkUnlockConditions(badge: any, progression: any, stats: any) {
    const condition = (badge.unlockCondition as Record<string, any>) ?? {};

    switch (badge.unlockType) {
      case "xp":
        return (progression?.totalXp ?? 0) >= (condition.xpRequired ?? 0);
      case "streak":
        return (stats?.maxStreak ?? 0) >= (condition.streakRequired ?? 0);
      case "leaderboard":
        return !!stats?.globalRank && stats.globalRank <= (condition.rankRequired ?? 0);
      default:
        return false;
    }
  }
}

export const badgeService = new BadgeService();
