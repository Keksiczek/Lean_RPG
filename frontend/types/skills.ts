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
  unlockType: string;
  shortTip?: string;
  learningResources?: string[];
  xpBonus?: number;
  pointsBonus?: number;
  badgeUnlock?: string | null;
  userState?: PlayerSkillState;
  isUnlocked?: boolean;
  meetsXpRequirement?: boolean;
  xpRemaining?: number;
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
  skill?: SkillTreeNode;
}

export interface ProgressionDashboardData {
  userId: number;
  totalXp: number;
  currentTier: number;
  unlockedSkillCount: number;
  activeSkillCount: number;
  nextTier: number;
  xpProgress: number;
  xpToNextTier: number;
  tierProgress: number;
}
