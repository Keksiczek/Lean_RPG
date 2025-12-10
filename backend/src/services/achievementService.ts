import prisma from "../lib/prisma.js";
import logger from "../lib/logger.js";
import { progressionService } from "./progressionService.js";

export class AchievementService {
  async listAchievementsForUser(userId: number) {
    const achievements = await prisma.achievement.findMany({
      where: { active: true },
      include: {
        userAchievements: {
          where: { userId },
          select: { progress: true, completedAt: true },
        },
      },
      orderBy: [
        { difficulty: "asc" },
        { category: "asc" },
        { name: "asc" },
      ],
    });

    return achievements.map((achievement) => ({
      ...achievement,
      userProgress: achievement.userAchievements[0] ?? { progress: 0, completedAt: null },
    }));
  }

  async updateAchievementProgress(userId: number, trackingField: string, value: number) {
    const achievements = await prisma.achievement.findMany({
      where: { trackingField, active: true },
    });

    const completed: any[] = [];

    for (const achievement of achievements) {
      let userAchievement = await prisma.userAchievement.findUnique({
        where: { userId_achievementId: { userId, achievementId: achievement.id } },
      });

      if (!userAchievement) {
        userAchievement = await prisma.userAchievement.create({
          data: { userId, achievementId: achievement.id, progress: 0 },
        });
      }

      if (userAchievement.completedAt) continue;

      const progress = Math.min(100, Math.floor((value / achievement.targetValue) * 100));
      const isCompleted = progress >= 100;

      await prisma.userAchievement.update({
        where: { id: userAchievement.id },
        data: {
          progress,
          completedAt: isCompleted ? new Date() : null,
          notified: false,
        },
      });

      if (isCompleted) {
        await progressionService.addXp(userId, achievement.xpReward);

        if (achievement.badgeId) {
          await prisma.userBadge.upsert({
            where: { userId_badgeId: { userId, badgeId: achievement.badgeId } },
            update: {},
            create: { userId, badgeId: achievement.badgeId },
          });
        }

        completed.push(achievement);
        logger.info({ userId, achievementId: achievement.id, progress }, "Achievement progress updated");
      }
    }

    return completed;
  }
}

export const achievementService = new AchievementService();
