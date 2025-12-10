import { z } from "zod";
import prisma from "../lib/prisma.js";
import logger from "../lib/logger.js";
import { HttpError, NotFoundError, ValidationError } from "../middleware/errors.js";

const SkillIdSchema = z.number().int().positive();
const UserIdSchema = z.number().int().positive();

function parseUserId(userId: number) {
  try {
    return UserIdSchema.parse(userId);
  } catch (error) {
    throw new ValidationError("Invalid user id", { userId });
  }
}

function parseSkillId(skillId: number) {
  try {
    return SkillIdSchema.parse(skillId);
  } catch (error) {
    throw new ValidationError("Invalid skill id", { skillId });
  }
}

const tierThresholds: Record<number, number> = {
  1: 0,
  2: 500,
  3: 1500,
};

export class SkillTreeService {
  async getSkillTree(userId?: number) {
    const includeUnlocked = userId
      ? {
          unlockedBy: {
            where: { userId },
            select: { isUnlocked: true, isActive: true, level: true, progress: true },
          },
        }
      : undefined;

    try {
      return await prisma.skillTreeNode.findMany({
        where: { active: true },
        include: includeUnlocked,
        orderBy: [
          { tier: "asc" },
          { requiresXp: "asc" },
          { id: "asc" },
        ],
      });
    } catch (error) {
      logger.error({ message: "skill_tree_fetch_failed", error });
      throw new HttpError("Failed to fetch skill tree", 500);
    }
  }

  async getUserSkills(userId: number) {
    const parsedUserId = parseUserId(userId);

    try {
      return await prisma.playerSkill.findMany({
        where: { userId: parsedUserId },
        include: { skill: true },
        orderBy: [{ skill: { tier: "asc" } }],
      });
    } catch (error) {
      logger.error({ message: "user_skills_fetch_failed", error, userId });
      throw new HttpError("Failed to fetch user skills", 500);
    }
  }

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

  async activateSkill(userId: number, skillId: number) {
    const parsedUserId = parseUserId(userId);
    const parsedSkillId = parseSkillId(skillId);

    try {
      return await prisma.$transaction(async (tx) => {
        const playerSkill = await tx.playerSkill.findUnique({
          where: { userId_skillId: { userId: parsedUserId, skillId: parsedSkillId } },
        });

        if (!playerSkill || !playerSkill.isUnlocked) {
          throw new NotFoundError("Skill");
        }

        if (playerSkill.isActive) {
          return playerSkill;
        }

        const activeCount = await tx.playerSkill.count({
          where: { userId: parsedUserId, isActive: true },
        });

        if (activeCount >= 3) {
          throw new HttpError("Maximum 3 active skills allowed", 400, "MAX_ACTIVE_SKILLS");
        }

        const updated = await tx.playerSkill.update({
          where: { userId_skillId: { userId: parsedUserId, skillId: parsedSkillId } },
          data: { isActive: true, activatedAt: new Date() },
        });

        await tx.skillProgression.update({
          where: { userId: parsedUserId },
          data: { activeSkillCount: { increment: 1 } },
        });

        logger.info({ message: "skill_activated", userId: parsedUserId, skillId: parsedSkillId });

        return updated;
      });
    } catch (error) {
      logger.error({ message: "skill_activate_failed", error, userId, skillId });
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError("Failed to activate skill", 500);
    }
  }

  async deactivateSkill(userId: number, skillId: number) {
    const parsedUserId = parseUserId(userId);
    const parsedSkillId = parseSkillId(skillId);

    try {
      return await prisma.$transaction(async (tx) => {
        const playerSkill = await tx.playerSkill.findUnique({
          where: { userId_skillId: { userId: parsedUserId, skillId: parsedSkillId } },
        });

        if (!playerSkill) {
          throw new NotFoundError("Skill");
        }

        const updated = await tx.playerSkill.update({
          where: { userId_skillId: { userId: parsedUserId, skillId: parsedSkillId } },
          data: { isActive: false },
        });

        if (playerSkill.isActive) {
          await tx.skillProgression.update({
            where: { userId: parsedUserId },
            data: { activeSkillCount: { decrement: 1 } },
          });
        }

        logger.info({ message: "skill_deactivated", userId: parsedUserId, skillId: parsedSkillId });

        return updated;
      });
    } catch (error) {
      logger.error({ message: "skill_deactivate_failed", error, userId, skillId });
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError("Failed to deactivate skill", 500);
    }
  }

  async checkUnlocks(userId: number) {
    const parsedUserId = parseUserId(userId);
    const progression = await prisma.skillProgression.findUnique({ where: { userId: parsedUserId } });

    if (!progression) {
      throw new NotFoundError("Progression");
    }

    return prisma.skillTreeNode.findMany({
      where: {
        active: true,
        requiresXp: { lte: progression.totalXp },
      },
    });
  }

  async unlockSkill(userId: number, skillId: number) {
    const parsedUserId = parseUserId(userId);
    const parsedSkillId = parseSkillId(skillId);

    try {
      return await prisma.$transaction(async (tx) => {
        const skill = await tx.skillTreeNode.findUnique({ where: { id: parsedSkillId } });
        if (!skill) {
          throw new NotFoundError("Skill");
        }

        const existing = await tx.playerSkill.findUnique({
          where: { userId_skillId: { userId: parsedUserId, skillId: parsedSkillId } },
        });

        if (existing?.isUnlocked) {
          return existing;
        }

        if (existing) {
          const updated = await tx.playerSkill.update({
            where: { userId_skillId: { userId: parsedUserId, skillId: parsedSkillId } },
            data: { isUnlocked: true, unlockedAt: new Date() },
          });

          await tx.skillProgression.update({
            where: { userId: parsedUserId },
            data: { unlockedSkillCount: { increment: 1 } },
          });

          return updated;
        }

        const created = await tx.playerSkill.create({
          data: {
            userId: parsedUserId,
            skillId: parsedSkillId,
            isUnlocked: true,
            unlockedAt: new Date(),
          },
        });

        await tx.skillProgression.update({
          where: { userId: parsedUserId },
          data: { unlockedSkillCount: { increment: 1 } },
        });

        logger.info({ message: "skill_unlocked", userId: parsedUserId, skillId: parsedSkillId });

        return created;
      });
    } catch (error) {
      logger.error({ message: "skill_unlock_failed", error, userId, skillId });
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError("Failed to unlock skill", 500);
    }
  }

  async getProgressionDashboard(userId: number) {
    const parsedUserId = parseUserId(userId);

    try {
      const progression = await prisma.skillProgression.findUnique({ where: { userId: parsedUserId } });

      if (!progression) {
        throw new NotFoundError("Progression");
      }

      const unlockedSkills = await prisma.playerSkill.findMany({
        where: { userId: parsedUserId, isUnlocked: true },
        select: { skillId: true },
      });

      const nextTier = Math.min(3, progression.currentTier + 1);
      const currentThreshold = tierThresholds[progression.currentTier];
      const nextThreshold = tierThresholds[nextTier] ?? tierThresholds[progression.currentTier];
      const tierProgress = nextThreshold === currentThreshold
        ? 1
        : (progression.totalXp - currentThreshold) /
          Math.max(1, nextThreshold - currentThreshold);

      return {
        ...progression,
        unlockedSkillIds: unlockedSkills.map((s) => s.skillId),
        nextTier,
        xpProgress: progression.totalXp - currentThreshold,
        xpToNextTier: Math.max(0, nextThreshold - progression.totalXp),
        tierProgress,
      };
    } catch (error) {
      logger.error({ message: "progression_dashboard_failed", error, userId });
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError("Failed to fetch dashboard", 500);
    }
  }
}

export const skillTreeService = new SkillTreeService();
