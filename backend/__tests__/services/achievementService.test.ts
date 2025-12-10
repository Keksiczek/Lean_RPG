import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createTestUser,
  mockPrisma,
  mockProgressionService,
  prismaState,
  resetMockData,
  setAchievementDefinitions,
} from "../setup/prismaMock";

vi.mock("../../src/lib/prisma.js", () => ({ default: mockPrisma, prisma: mockPrisma }));
vi.mock("../../src/services/progressionService.js", () => ({ progressionService: mockProgressionService }));

import { achievementService } from "../../src/services/achievementService.js";

describe("AchievementService", () => {
  beforeEach(() => {
    resetMockData();
    setAchievementDefinitions([
      {
        id: 1,
        code: "AUDITOR",
        name: "Auditor",
        description: "Complete 5 audits",
        xpReward: 100,
        badgeId: 99,
        type: "counter",
        targetValue: 5,
        trackingField: "audits_completed",
        active: true,
        userAchievements: [],
      },
    ]);
  });

  describe("updateAchievementProgress", () => {
    it("should update progress for counter achievement", async () => {
      const user = createTestUser();

      await achievementService.updateAchievementProgress(user.id, "audits_completed", 3);

      const userAchievement = prismaState.userAchievements.get(`${user.id}-1`);
      expect(userAchievement?.progress).toBe(60);
    });

    it("should complete achievement when targetValue reached", async () => {
      const user = createTestUser();

      await achievementService.updateAchievementProgress(user.id, "audits_completed", 5);

      const userAchievement = prismaState.userAchievements.get(`${user.id}-1`);
      expect(userAchievement?.completedAt).toBeTruthy();
      expect(userAchievement?.progress).toBe(100);
    });

    it("should award XP when achievement completed", async () => {
      const user = createTestUser();
      const progression = prismaState.progressionRecords.get(user.id);
      const beforeXp = progression?.totalXp ?? 0;

      await achievementService.updateAchievementProgress(user.id, "audits_completed", 5);

      const afterXp = prismaState.progressionRecords.get(user.id)?.totalXp ?? 0;
      expect(afterXp).toBeGreaterThan(beforeXp + 90);
    });

    it("should unlock linked badge on achievement completion", async () => {
      const user = createTestUser();

      await achievementService.updateAchievementProgress(user.id, "audits_completed", 5);

      const badgeKey = `${user.id}-99`;
      expect(prismaState.userBadges.has(badgeKey)).toBe(true);
    });

    it("should not update after completion", async () => {
      const user = createTestUser();

      await achievementService.updateAchievementProgress(user.id, "audits_completed", 5);
      const completed = await achievementService.updateAchievementProgress(user.id, "audits_completed", 10);

      expect(completed.length).toBe(0);
    });
  });
});
