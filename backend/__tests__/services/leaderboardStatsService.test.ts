import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createTestUser,
  mockPrisma,
  prismaState,
  resetMockData,
} from "../setup/prismaMock";

vi.mock("../../src/lib/prisma.js", () => ({ default: mockPrisma, prisma: mockPrisma }));

import { leaderboardStatsService } from "../../src/services/leaderboardStatsService.js";

describe("LeaderboardStatsService", () => {
  beforeEach(() => {
    resetMockData();
  });

  describe("updateStats", () => {
    it("should calculate XP per day correctly", async () => {
      const user = createTestUser();
      const progression = prismaState.progressionRecords.get(user.id);
      if (progression) progression.totalXp = 100;

      await leaderboardStatsService.updateStats(user.id);

      await new Promise((resolve) => setImmediate(resolve));

      const stats = prismaState.leaderboardRecords.get(user.id);
      expect(stats?.xpPerDay).toBeGreaterThan(0);
    });

    it("should calculate global rank correctly", async () => {
      const user1 = createTestUser();
      const user2 = createTestUser();
      const prog1 = prismaState.progressionRecords.get(user1.id);
      const prog2 = prismaState.progressionRecords.get(user2.id);
      if (prog1) prog1.totalXp = 500;
      if (prog2) prog2.totalXp = 100;

      await leaderboardStatsService.updateStats(user1.id);
      await leaderboardStatsService.updateStats(user2.id);

      await new Promise((resolve) => setImmediate(resolve));

      const stats1 = prismaState.leaderboardRecords.get(user1.id);
      const stats2 = prismaState.leaderboardRecords.get(user2.id);

      expect((stats1?.globalRank ?? 999) < (stats2?.globalRank ?? 999)).toBe(true);
    });

    it("should detect XP trend (rising/falling/stable)", async () => {
      const user = createTestUser();
      const progression = prismaState.progressionRecords.get(user.id);
      if (progression) progression.totalXp = 100;

      await leaderboardStatsService.updateStats(user.id);
      const first = prismaState.leaderboardRecords.get(user.id);

      if (progression) progression.totalXp = 300;
      await leaderboardStatsService.updateStats(user.id);
      const second = prismaState.leaderboardRecords.get(user.id);

      await new Promise((resolve) => setImmediate(resolve));

      expect(first?.xpTrend).toBe("stable");
      expect(second?.xpTrend).toBe("rising");
    });
  });
});
