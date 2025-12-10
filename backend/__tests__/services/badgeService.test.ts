import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  createTestUser,
  mockPrisma,
  mockProgressionService,
  prismaState,
  resetMockData,
  setBadgeDefinitions,
} from "../setup/prismaMock";

vi.mock("../../src/lib/prisma.js", () => ({ default: mockPrisma, prisma: mockPrisma }));
vi.mock("../../src/services/progressionService.js", () => ({ progressionService: mockProgressionService }));

import { badgeService } from "../../src/services/badgeService.js";

describe("BadgeService", () => {
  beforeEach(() => {
    resetMockData();
    setBadgeDefinitions([
      {
        id: 1,
        code: "5S_CHAMPION",
        name: "5S Champion",
        description: "Earn 500 XP",
        unlockType: "xp",
        unlockCondition: { xpRequired: 500 },
        xpReward: 0,
        userBadges: [],
      },
      {
        id: 2,
        code: "STREAK_MASTER",
        name: "Streak Master",
        description: "Hit 10 day streak",
        unlockType: "streak",
        unlockCondition: { streakRequired: 10 },
        xpReward: 0,
        userBadges: [],
      },
      {
        id: 3,
        code: "TOP_10",
        name: "Top 10 Player",
        description: "Reach top 10",
        unlockType: "leaderboard",
        unlockCondition: { rankRequired: 10 },
        xpReward: 25,
        userBadges: [],
      },
    ]);
  });

  describe("listBadgesForUser", () => {
    it("should return all active badges with unlock status", async () => {
      const user = createTestUser();
      setBadgeDefinitions([
        {
          id: 10,
          code: "TEST_BADGE",
          name: "Tester",
          description: "",
          unlockType: "xp",
          unlockCondition: { xpRequired: 0 },
          userBadges: [{ unlockedAt: new Date().toISOString() }],
        },
      ]);

      const badges = await badgeService.listBadgesForUser(user.id);

      expect(badges).toBeInstanceOf(Array);
      expect(badges[0]).toHaveProperty("isUnlocked", true);
      expect(badges[0]).toHaveProperty("unlockedAt");
    });

    it("should return empty array if no badges exist", async () => {
      setBadgeDefinitions([]);
      const badges = await badgeService.listBadgesForUser(99999);
      expect(badges).toEqual([]);
    });
  });

  describe("checkAndUnlockBadges", () => {
    it("should unlock badge when XP threshold met", async () => {
      const user = createTestUser();
      const progression = prismaState.progressionRecords.get(user.id);
      if (progression) progression.totalXp = 500;

      const unlocked = await badgeService.checkAndUnlockBadges(user.id);

      expect(unlocked.length).toBeGreaterThan(0);
      expect(unlocked[0]).toHaveProperty("code", "5S_CHAMPION");
    });

    it("should not duplicate badge unlocks", async () => {
      const user = createTestUser();
      const progression = prismaState.progressionRecords.get(user.id);
      if (progression) progression.totalXp = 500;

      const first = await badgeService.checkAndUnlockBadges(user.id);
      const second = await badgeService.checkAndUnlockBadges(user.id);

      expect(first.length).toBe(second.length);
    });

    it("should unlock badge based on streak condition", async () => {
      const user = createTestUser();
      const leaderboard = prismaState.leaderboardRecords.get(user.id);
      if (leaderboard) leaderboard.maxStreak = 10;

      const unlocked = await badgeService.checkAndUnlockBadges(user.id);

      expect(unlocked.some((badge) => badge.code === "STREAK_MASTER")).toBe(true);
    });

    it("should unlock badge based on leaderboard rank", async () => {
      const user = createTestUser();
      const leaderboard = prismaState.leaderboardRecords.get(user.id);
      if (leaderboard) leaderboard.globalRank = 5;

      const unlocked = await badgeService.checkAndUnlockBadges(user.id);

      expect(unlocked.some((badge) => badge.code === "TOP_10")).toBe(true);
    });

    it("should award XP when badge has xpReward", async () => {
      const user = createTestUser();
      const progression = prismaState.progressionRecords.get(user.id);
      if (progression) progression.totalXp = 500;

      const unlocked = await badgeService.checkAndUnlockBadges(user.id);

      expect(mockProgressionService.addXp).toHaveBeenCalledWith(user.id, 25);
      expect(unlocked.some((badge) => badge.code === "TOP_10")).toBe(true);
    });
  });
});
