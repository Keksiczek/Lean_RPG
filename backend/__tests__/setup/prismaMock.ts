import { vi } from "vitest";

type ProgressionRecord = {
  userId: number;
  totalXp: number;
  currentTier: number;
  tierUnlockedAt: Record<string, unknown>;
};

type LeaderboardRecord = {
  userId: number;
  globalRank?: number | null;
  maxStreak?: number;
  xpPerDay?: number;
  xpTrend?: string | null;
  lastUpdated?: Date;
};

type UserRecord = {
  id: number;
  name?: string;
  email?: string;
  createdAt: Date;
};

type UserAchievementRecord = {
  id: number;
  userId: number;
  achievementId: number;
  progress: number;
  completedAt: Date | null;
  notified: boolean;
};

type UserBadgeRecord = {
  id: number;
  userId: number;
  badgeId: number;
  unlockedAt: Date;
};

let badgeDefinitions: any[] = [];
let achievementDefinitions: any[] = [];
const progressionRecords = new Map<number, ProgressionRecord>();
const leaderboardRecords = new Map<number, LeaderboardRecord>();
const userRecords = new Map<number, UserRecord>();
const userBadges = new Map<string, UserBadgeRecord>();
const userAchievements = new Map<string, UserAchievementRecord>();
let badgeIdSeq = 1;
let achievementIdSeq = 1;
let userAchievementIdSeq = 1;
let userBadgeIdSeq = 1;
let userIdSeq = 1;

function badgeKey(userId: number, badgeId: number) {
  return `${userId}-${badgeId}`;
}

function achievementKey(userId: number, achievementId: number) {
  return `${userId}-${achievementId}`;
}

export const mockPrisma = {
  badge: {
    findMany: vi.fn(async () => badgeDefinitions),
  },
  userBadge: {
    findUnique: vi.fn(async ({ where: { userId_badgeId } }) => {
      const key = badgeKey(userId_badgeId.userId, userId_badgeId.badgeId);
      return userBadges.get(key) ?? null;
    }),
    create: vi.fn(async ({ data }: { data: { userId: number; badgeId: number } }) => {
      const key = badgeKey(data.userId, data.badgeId);
      const record: UserBadgeRecord = {
        id: userBadgeIdSeq++,
        userId: data.userId,
        badgeId: data.badgeId,
        unlockedAt: new Date(),
      };
      userBadges.set(key, record);
      return record;
    }),
    upsert: vi.fn(async ({ where: { userId_badgeId }, create }: any) => {
      const key = badgeKey(userId_badgeId.userId, userId_badgeId.badgeId);
      if (!userBadges.has(key)) {
        userBadges.set(key, {
          id: userBadgeIdSeq++,
          userId: userId_badgeId.userId,
          badgeId: userId_badgeId.badgeId,
          unlockedAt: new Date(),
        });
      }
      return userBadges.get(key) ?? create;
    }),
  },
  skillProgression: {
    findUnique: vi.fn(async ({ where: { userId } }: any) => progressionRecords.get(userId) ?? null),
    create: vi.fn(async ({ data }: any) => {
      const record: ProgressionRecord = {
        userId: data.userId,
        totalXp: data.totalXp ?? 0,
        currentTier: data.currentTier ?? 1,
        tierUnlockedAt: data.tierUnlockedAt ?? {},
      };
      progressionRecords.set(data.userId, record);
      return record;
    }),
    update: vi.fn(async ({ where: { userId }, data }: any) => {
      const existing = progressionRecords.get(userId);
      if (!existing) {
        throw new Error("progression_missing");
      }
      const updated = {
        ...existing,
        ...data,
        totalXp: data.totalXp ?? existing.totalXp,
        currentTier: data.currentTier ?? existing.currentTier,
        tierUnlockedAt: data.tierUnlockedAt ?? existing.tierUnlockedAt,
      };
      progressionRecords.set(userId, updated);
      return updated;
    }),
    count: vi.fn(async ({ where }: any) => {
      const threshold = where?.totalXp?.gt ?? 0;
      return Array.from(progressionRecords.values()).filter((p) => p.totalXp > threshold).length;
    }),
  },
  skillTreeNode: {
    findMany: vi.fn(async () => []),
  },
  xpLog: {
    create: vi.fn(async () => ({})),
  },
  leaderboardStats: {
    findUnique: vi.fn(async ({ where: { userId } }: any) => leaderboardRecords.get(userId) ?? null),
    upsert: vi.fn(async ({ where: { userId }, create, update }: any) => {
      const existing = leaderboardRecords.get(userId);
      const record = existing ? { ...existing, ...update } : { ...create, userId };
      leaderboardRecords.set(userId, record);
      return record;
    }),
    findMany: vi.fn(async ({ where }: any) => {
      const gte = where?.lastUpdated?.gte;
      return Array.from(leaderboardRecords.values()).filter((record) => !gte || (record.lastUpdated ?? new Date()) >= gte);
    }),
  },
  achievement: {
    findMany: vi.fn(async ({ where }: any) => {
      if (!where?.trackingField) return achievementDefinitions;
      return achievementDefinitions.filter((ach) => ach.trackingField === where.trackingField);
    }),
  },
  userAchievement: {
    findUnique: vi.fn(async ({ where: { userId_achievementId } }: any) => {
      const key = achievementKey(userId_achievementId.userId, userId_achievementId.achievementId);
      return userAchievements.get(key) ?? null;
    }),
    create: vi.fn(async ({ data }: any) => {
      const key = achievementKey(data.userId, data.achievementId);
      const record: UserAchievementRecord = {
        id: userAchievementIdSeq++,
        userId: data.userId,
        achievementId: data.achievementId,
        progress: data.progress ?? 0,
        completedAt: data.completedAt ?? null,
        notified: data.notified ?? false,
      };
      userAchievements.set(key, record);
      return record;
    }),
    update: vi.fn(async ({ where: { id }, data }: any) => {
      for (const [key, value] of userAchievements.entries()) {
        if (value.id === id) {
          const updated = { ...value, ...data } as UserAchievementRecord;
          userAchievements.set(key, updated);
          return updated;
        }
      }
      throw new Error("user_achievement_missing");
    }),
  },
  user: {
    findUnique: vi.fn(async ({ where: { id } }: any) => userRecords.get(id) ?? null),
  },
  playerSkill: {
    findMany: vi.fn(async () => []),
  },
  playerComparison: {
    findUnique: vi.fn(async () => null),
  },
};

export const mockProgressionService = {
  addXp: vi.fn(async (userId: number, xp: number) => {
    const existing = progressionRecords.get(userId);
    if (existing) {
      existing.totalXp += xp;
    } else {
      progressionRecords.set(userId, {
        userId,
        totalXp: xp,
        currentTier: 1,
        tierUnlockedAt: {},
      });
    }
  }),
};

export function resetMockData() {
  badgeDefinitions = [];
  achievementDefinitions = [];
  progressionRecords.clear();
  leaderboardRecords.clear();
  userRecords.clear();
  userBadges.clear();
  userAchievements.clear();
  badgeIdSeq = 1;
  achievementIdSeq = 1;
  userAchievementIdSeq = 1;
  userBadgeIdSeq = 1;
  userIdSeq = 1;
  mockProgressionService.addXp.mockClear();
  Object.values(mockPrisma).forEach((section: any) => {
    Object.values(section).forEach((fn: any) => fn.mockClear && fn.mockClear());
  });
}

export function setBadgeDefinitions(badges: any[]) {
  badgeDefinitions = badges;
}

export function setAchievementDefinitions(achievements: any[]) {
  achievementDefinitions = achievements;
}

export function createTestUser() {
  const id = userIdSeq++;
  const user: UserRecord = { id, name: `User ${id}`, createdAt: new Date(Date.now() - 86400000) };
  userRecords.set(id, user);
  progressionRecords.set(id, { userId: id, totalXp: 0, currentTier: 1, tierUnlockedAt: {} });
  leaderboardRecords.set(id, { userId: id, globalRank: null, maxStreak: 0, xpPerDay: 0, xpTrend: "stable", lastUpdated: new Date() });
  return user;
}

export const prismaState = {
  get badgeDefinitions() {
    return badgeDefinitions;
  },
  get achievementDefinitions() {
    return achievementDefinitions;
  },
  progressionRecords,
  leaderboardRecords,
  userRecords,
  userBadges,
  userAchievements,
};
