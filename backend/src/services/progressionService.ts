import { z } from "zod";
import prisma from "../lib/prisma.js";
import logger from "../lib/logger.js";
import { HttpError, ValidationError } from "../middleware/errors.js";
import { skillTreeService } from "./skillTreeService.js";

const UserIdSchema = z.number().int().positive();

function parseUserId(userId: number) {
  try {
    return UserIdSchema.parse(userId);
  } catch (error) {
    throw new ValidationError("Invalid user id", { userId });
  }
}

const tierThresholds: Record<number, number> = {
  1: 0,
  2: 500,
  3: 1500,
};

export class ProgressionService {
  async ensureProgression(userId: number) {
    const parsedUserId = parseUserId(userId);
    const progression = await prisma.skillProgression.findUnique({ where: { userId: parsedUserId } });

    if (progression) return progression;

    return prisma.skillProgression.create({
      data: {
        userId: parsedUserId,
        totalXp: 0,
        currentTier: 1,
        tierUnlockedAt: { 1: new Date().toISOString() },
      },
    });
  }

  async addXp(userId: number, xpAmount: number) {
    const parsedUserId = parseUserId(userId);

    if (xpAmount < 0) {
      throw new ValidationError("XP amount cannot be negative");
    }

    const progression = await this.ensureProgression(parsedUserId);
    const newXp = progression.totalXp + xpAmount;
    const newTier = newXp >= 1500 ? 3 : newXp >= 500 ? 2 : 1;

    const tierHistory = (progression.tierUnlockedAt as Record<string, unknown> | null) ?? {};

    try {
      await prisma.$transaction(async (tx) => {
        await tx.skillProgression.update({
          where: { userId: parsedUserId },
          data: {
            totalXp: newXp,
            currentTier: newTier,
            lastLevelUp: new Date(),
            ...(newTier > progression.currentTier && {
              tierUnlockedAt: {
                ...tierHistory,
                [newTier]: new Date().toISOString(),
              },
            }),
          },
        });

        await tx.xpLog.create({
          data: {
            userId: parsedUserId,
            source: "skill_progression",
            xpChange: xpAmount,
            note: `Awarded ${xpAmount} XP`,
          },
        });
      });

      await this.checkAndUnlockSkills(parsedUserId);
    } catch (error) {
      logger.error({ message: "add_xp_failed", error, userId, xpAmount });
      if (error instanceof HttpError || error instanceof ValidationError) {
        throw error;
      }
      throw new HttpError("Failed to add XP", 500);
    }
  }

  private async checkAndUnlockSkills(userId: number) {
    const progression = await prisma.skillProgression.findUnique({ where: { userId } });
    if (!progression) return;

    const unlockable = await prisma.skillTreeNode.findMany({
      where: {
        active: true,
        requiresXp: { lte: progression.totalXp },
      },
      select: { id: true },
    });

    for (const skill of unlockable) {
      await skillTreeService.unlockSkill(userId, skill.id);
    }
  }

  async checkTierUnlock(userId: number) {
    const parsedUserId = parseUserId(userId);
    const progression = await this.ensureProgression(parsedUserId);
    const tierHistory = (progression.tierUnlockedAt as Record<string, unknown> | null) ?? {};

    const newTier = progression.totalXp >= tierThresholds[3]
      ? 3
      : progression.totalXp >= tierThresholds[2]
        ? 2
        : 1;

    if (newTier > progression.currentTier) {
      await prisma.skillProgression.update({
        where: { userId: parsedUserId },
        data: {
          currentTier: newTier,
          tierUnlockedAt: {
            ...tierHistory,
            [newTier]: new Date().toISOString(),
          },
        },
      });
    }
  }

  async getProgressionLeaderboard(limit = 10) {
    if (limit < 1 || limit > 100) {
      throw new ValidationError("Limit must be between 1 and 100");
    }

    try {
      return await prisma.user.findMany({
        include: { skillProgression: true },
        orderBy: [
          { skillProgression: { currentTier: "desc" } },
          { skillProgression: { totalXp: "desc" } },
        ],
        take: limit,
      });
    } catch (error) {
      logger.error({ message: "progression_leaderboard_failed", error, limit });
      throw new HttpError("Failed to load leaderboard", 500);
    }
  }

  async getProgressionHistory(userId: number, limit = 10) {
    const parsedUserId = parseUserId(userId);

    if (limit < 1 || limit > 100) {
      throw new ValidationError("Limit must be between 1 and 100");
    }

    try {
      return await prisma.xpLog.findMany({
        where: { userId: parsedUserId },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    } catch (error) {
      logger.error({ message: "progression_history_failed", error, userId, limit });
      throw new HttpError("Failed to load progression history", 500);
    }
  }
}

export const progressionService = new ProgressionService();
