import { z } from "zod";
import prisma from "../lib/prisma.js";
import logger from "../lib/logger.js";
import { HttpError, NotFoundError, ValidationError } from "../middleware/errors.js";
import { progressionService } from "./progressionService.js";
import { skillTreeService } from "./skillTreeService.js";

const UserIdSchema = z.number().int().positive();
const SkillIdSchema = z.number().int().positive();

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

export class SkillUnlockService {
  async meetsUnlockConditions(userId: number, skillId: number) {
    const parsedUserId = parseUserId(userId);
    const parsedSkillId = parseSkillId(skillId);

    try {
      const skill = await prisma.skillTreeNode.findUnique({ where: { id: parsedSkillId } });
      if (!skill) {
        throw new NotFoundError("Skill");
      }

      const progression = await prisma.skillProgression.findUnique({ where: { userId: parsedUserId } });
      if (!progression) {
        throw new NotFoundError("Progression");
      }

      const playerSkill = await prisma.playerSkill.findUnique({
        where: { userId_skillId: { userId: parsedUserId, skillId: parsedSkillId } },
      });

      const missingConditions: string[] = [];
      let progress = 0;

      if (progression.totalXp < skill.requiresXp) {
        missingConditions.push(`Needs ${skill.requiresXp - progression.totalXp} more XP`);
        progress = (progression.totalXp / Math.max(1, skill.requiresXp)) * 100;
      } else {
        progress = 100;
      }

      if (skill.requiresSkills.length > 0) {
        const requiredSkills = await prisma.playerSkill.findMany({
          where: {
            userId: parsedUserId,
            skillId: { in: skill.requiresSkills },
            isUnlocked: false,
          },
        });

        if (requiredSkills.length > 0) {
          missingConditions.push(`Requires ${requiredSkills.length} prerequisite skill(s)`);
        }
      }

      return {
        meets: missingConditions.length === 0 && !playerSkill?.isUnlocked,
        missingConditions,
        progress: Math.min(progress, 100),
      };
    } catch (error) {
      logger.error({ message: "unlock_conditions_failed", error, userId, skillId });
      if (error instanceof HttpError || error instanceof ValidationError) {
        throw error;
      }
      throw new HttpError("Failed to evaluate unlock conditions", 500);
    }
  }

  async getUnlockStatus(userId: number) {
    const parsedUserId = parseUserId(userId);
    const progression = await progressionService.ensureProgression(parsedUserId);

    const allSkills = await prisma.skillTreeNode.findMany({ where: { active: true } });
    const unlockedSkills = await prisma.playerSkill.findMany({
      where: { userId: parsedUserId, isUnlocked: true },
      select: { skillId: true },
    });

    const unlockedIds = new Set(unlockedSkills.map((skill) => skill.skillId));

    return allSkills.map((skill) => ({
      ...skill,
      isUnlocked: unlockedIds.has(skill.id),
      meetsXpRequirement: progression.totalXp >= skill.requiresXp,
      xpProgress: progression.totalXp,
      xpRemaining: Math.max(0, skill.requiresXp - progression.totalXp),
    }));
  }

  async handleQuestCompletion(
    userId: number,
    questType: "5S_AUDIT" | "GEMBA_WALK" | "PROBLEM_SOLVING",
    score: number,
  ) {
    const parsedUserId = parseUserId(userId);

    if (score < 0 || score > 100) {
      throw new ValidationError("Score must be between 0 and 100");
    }

    try {
      const baseXp = questType === "5S_AUDIT" ? 40 : questType === "GEMBA_WALK" ? 50 : 120;
      const xpAmount = Math.floor(baseXp * (score / 100));

      await progressionService.addXp(parsedUserId, xpAmount);

      return skillTreeService.checkUnlocks(parsedUserId);
    } catch (error) {
      logger.error({ message: "quest_completion_unlock_failed", error, userId, questType });
      if (error instanceof HttpError || error instanceof ValidationError) {
        throw error;
      }
      throw new HttpError("Failed to process quest completion", 500);
    }
  }

  async handleBadgeEarned(userId: number, badgeId: number) {
    const parsedUserId = parseUserId(userId);

    try {
      const skillsToUnlock = await prisma.skillTreeNode.findMany({
        where: { badgeUnlock: badgeId.toString(), active: true },
      });

      for (const skill of skillsToUnlock) {
        await skillTreeService.unlockSkill(parsedUserId, skill.id);
      }

      return skillsToUnlock;
    } catch (error) {
      logger.error({ message: "badge_unlock_failed", error, userId, badgeId });
      if (error instanceof HttpError || error instanceof ValidationError) {
        throw error;
      }
      throw new HttpError("Failed to unlock skills for badge", 500);
    }
  }
}

export const skillUnlockService = new SkillUnlockService();
