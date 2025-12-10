export type UnlockType = "xp" | "quest" | "badge" | "manager";

export interface SkillTreeNode {
  id: number;
  name: string;
  description: string;
  category: string;
  tier: number;
  requiresXp: number;
  icon?: string;
  color?: string;
  requiresSkills: number[];
  unlockType: UnlockType;
  unlockData?: Record<string, unknown> | null;
  shortTip?: string;
  learningResources?: string[];
  xpBonus?: number;
  pointsBonus?: number;
  badgeUnlock?: string | null;
  active?: boolean;
}

export interface PlayerSkillState {
  skillId: number;
  level: number;
  progress: number;
  isUnlocked: boolean;
  isActive: boolean;
  skillXp: number;
  masteryLevel: "beginner" | "intermediate" | "expert";
  unlockedAt?: string;
  activatedAt?: string;
}

export interface SkillProgressionState {
  userId: number;
  totalXp: number;
  currentTier: number;
  unlockedSkillCount: number;
  activeSkillCount: number;
  lastLevelUp?: string | null;
  tierUnlockedAt: Record<number, string>;
  currentGoal?: string | null;
  goalProgress: number;
}

export interface SkillTreeNodeWithState extends SkillTreeNode {
  userState?: PlayerSkillState;
}
