import prisma from "../lib/prisma.js";

export class LeaderboardStatsService {
  async updateStats(userId: number) {
    const progression = await prisma.skillProgression.findUnique({ where: { userId } });
    if (!progression) return;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const daysSinceCreation = Math.max(
      1,
      (Date.now() - user.createdAt.getTime()) / (24 * 60 * 60 * 1000),
    );
    const xpPerDay = progression.totalXp / daysSinceCreation;

    const rank = await prisma.skillProgression.count({
      where: { totalXp: { gt: progression.totalXp } },
    });

    const previous = await prisma.leaderboardStats.findUnique({ where: { userId } });
    const trend = !previous
      ? "stable"
      : xpPerDay > previous.xpPerDay
        ? "rising"
        : xpPerDay < previous.xpPerDay
          ? "falling"
          : "stable";

    await prisma.leaderboardStats.upsert({
      where: { userId },
      create: {
        userId,
        globalRank: rank + 1,
        xpPerDay,
        xpTrend: trend,
      },
      update: {
        globalRank: rank + 1,
        xpPerDay,
        xpTrend: trend,
        lastUpdated: new Date(),
      },
    });
  }

  async getSkillLeaderboard(skillCode: string, limit = 50) {
    return prisma.playerSkill.findMany({
      where: { skill: { category: skillCode }, isUnlocked: true },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { skillXp: "desc" },
      take: limit,
    });
  }

  async getTrending(limit = 20) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return prisma.leaderboardStats.findMany({
      where: { lastUpdated: { gte: sevenDaysAgo } },
      include: { user: { select: { name: true } } },
      orderBy: { xpPerDay: "desc" },
      take: limit,
    });
  }

  async getComparison(userId1: number, userId2: number) {
    const [minId, maxId] = [Math.min(userId1, userId2), Math.max(userId1, userId2)];
    return prisma.playerComparison.findUnique({
      where: { userId1_userId2: { userId1: minId, userId2: maxId } },
      include: {
        user1: { select: { name: true, skillProgression: true } },
        user2: { select: { name: true, skillProgression: true } },
      },
    });
  }
}

export const leaderboardStatsService = new LeaderboardStatsService();
