import { z } from "zod";
import logger from "../lib/logger.js";
import {
  PlayerSkillState,
  SkillProgressionState,
  SkillTreeNode,
  SkillTreeNodeWithState,
} from "../types/skillTree.js";
import { skillTree, tierThresholds } from "../data/skillTree.js";
import { HttpError } from "../middleware/errors.js";

const SkillIdSchema = z.number().int().positive();
const UserIdSchema = z.number().int().positive();

function nowIso() {
  return new Date().toISOString();
}

export class SkillTreeEngine {
  private progression = new Map<number, SkillProgressionState>();
  private skills = new Map<number, Map<number, PlayerSkillState>>();

  getSkillTree(): SkillTreeNode[] {
    return skillTree.filter((skill) => skill.active !== false);
  }

  getSkillTreeForUser(user: { id: number; totalXp: number }): SkillTreeNodeWithState[] {
    this.ensureProgression(user);
    const userSkills = this.skills.get(user.id) || new Map();
    this.autoUnlock(user.id);

    return this.getSkillTree().map((skill) => ({
      ...skill,
      userState: userSkills.get(skill.id),
    }));
  }

  getUserSkills(user: { id: number; totalXp: number }) {
    const progression = this.ensureProgression(user);
    this.autoUnlock(user.id);
    const userSkills = Array.from(this.skills.get(user.id)?.values() || []);

    return { progression, skills: userSkills };
  }

  activateSkill(userId: number, skillId: number) {
    UserIdSchema.parse(userId);
    SkillIdSchema.parse(skillId);

    const skill = this.getSkillTree().find((item) => item.id === skillId);
    if (!skill) {
      throw new HttpError("Skill not found", 404);
    }

    const store = this.skills.get(userId);
    if (!store || !store.get(skillId)?.isUnlocked) {
      throw new HttpError("Skill not found or not unlocked", 404);
    }

    const activeCount = Array.from(store.values()).filter((s) => s.isActive).length;
    if (activeCount >= 3) {
      throw new HttpError("Maximum 3 active skills allowed", 400);
    }

    const existing = store.get(skillId)!;
    if (!existing.isActive) {
      store.set(skillId, {
        ...existing,
        isActive: true,
        activatedAt: nowIso(),
      });

      const progression = this.progression.get(userId);
      if (progression) {
        progression.activeSkillCount += 1;
      }
    }

    logger.info({ userId, skillId }, "skill_activated");
    return store.get(skillId);
  }

  deactivateSkill(userId: number, skillId: number) {
    UserIdSchema.parse(userId);
    SkillIdSchema.parse(skillId);

    const store = this.skills.get(userId);
    if (!store) {
      throw new HttpError("Skill not found", 404);
    }

    const existing = store.get(skillId);
    if (!existing) {
      throw new HttpError("Skill not found", 404);
    }

    if (existing.isActive) {
      store.set(skillId, { ...existing, isActive: false });
      const progression = this.progression.get(userId);
      if (progression && progression.activeSkillCount > 0) {
        progression.activeSkillCount -= 1;
      }
    }

    logger.info({ userId, skillId }, "skill_deactivated");
    return store.get(skillId);
  }

  getUnlockStatus(user: { id: number; totalXp: number }) {
    const progression = this.ensureProgression(user);
    this.autoUnlock(user.id);
    const unlockedIds = new Set(
      Array.from(this.skills.get(user.id)?.values() || [])
        .filter((s) => s.isUnlocked)
        .map((s) => s.skillId)
    );

    return this.getSkillTree().map((skill) => ({
      ...skill,
      isUnlocked: unlockedIds.has(skill.id),
      meetsXpRequirement: progression.totalXp >= skill.requiresXp,
      xpProgress: progression.totalXp,
      xpRemaining: Math.max(0, skill.requiresXp - progression.totalXp),
    }));
  }

  getProgressionDashboard(user: { id: number; totalXp: number }) {
    const progression = this.ensureProgression(user);
    this.autoUnlock(user.id);
    const nextTier = progression.currentTier < 3 ? progression.currentTier + 1 : 3;
    const nextTierXp = tierThresholds[nextTier] ?? tierThresholds[3];
    const xpProgress = progression.totalXp - tierThresholds[progression.currentTier];
    const xpToNextTier = nextTierXp - progression.totalXp;
    const tierSpan = nextTierXp - tierThresholds[progression.currentTier];

    return {
      ...progression,
      nextTier,
      xpProgress,
      xpToNextTier,
      tierProgress: tierSpan > 0 ? xpProgress / tierSpan : 1,
    };
  }

  addXp(user: { id: number; totalXp: number }, xpAmount: number) {
    UserIdSchema.parse(user.id);
    if (xpAmount < 0) {
      throw new HttpError("XP amount cannot be negative", 400);
    }

    const progression = this.ensureProgression(user);
    progression.totalXp += xpAmount;
    progression.lastLevelUp = nowIso();
    progression.currentTier = this.resolveTier(progression.totalXp);
    this.autoUnlock(user.id);
    return progression;
  }

  private ensureProgression(user: { id: number; totalXp: number }) {
    UserIdSchema.parse(user.id);
    const existing = this.progression.get(user.id);
    if (existing) {
      return existing;
    }

    const progression: SkillProgressionState = {
      userId: user.id,
      totalXp: user.totalXp || 0,
      currentTier: this.resolveTier(user.totalXp || 0),
      unlockedSkillCount: 0,
      activeSkillCount: 0,
      tierUnlockedAt: { 1: nowIso() },
      goalProgress: 0,
    };

    this.progression.set(user.id, progression);
    this.skills.set(user.id, new Map());
    this.autoUnlock(user.id);
    return progression;
  }

  private autoUnlock(userId: number) {
    const progression = this.progression.get(userId);
    if (!progression) return;

    const store = this.skills.get(userId) || new Map<number, PlayerSkillState>();
    let unlockedCount = progression.unlockedSkillCount;

    for (const skill of this.getSkillTree()) {
      const already = store.get(skill.id);
      const meetsXp = progression.totalXp >= skill.requiresXp;
      const prereqsMet = skill.requiresSkills.every((req) => store.get(req)?.isUnlocked);
      if (already?.isUnlocked) continue;
      if (meetsXp && prereqsMet) {
        store.set(skill.id, {
          skillId: skill.id,
          level: 1,
          progress: 0,
          isUnlocked: true,
          isActive: false,
          skillXp: 0,
          masteryLevel: "beginner",
          unlockedAt: nowIso(),
        });
        unlockedCount += 1;
        logger.info({ userId, skillId: skill.id }, "skill_auto_unlocked");
      }
    }

    this.skills.set(userId, store);
    progression.unlockedSkillCount = unlockedCount;
  }

  private resolveTier(totalXp: number) {
    if (totalXp >= tierThresholds[3]) return 3;
    if (totalXp >= tierThresholds[2]) return 2;
    return 1;
  }
}

export const skillTreeEngine = new SkillTreeEngine();
