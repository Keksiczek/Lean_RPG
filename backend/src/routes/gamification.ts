import { Request, Response, Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler.js";
import { UnauthorizedError, ValidationError, NotFoundError } from "../middleware/errors.js";
import { badgeService } from "../services/badgeService.js";
import { achievementService } from "../services/achievementService.js";
import { leaderboardStatsService } from "../services/leaderboardStatsService.js";
import logger from "../lib/logger.js";

const router = Router();

const skillCodeParamSchema = z.object({
  skillCode: z.string().regex(/^[A-Z0-9_]+$/, "Invalid skill code"),
});

const compareParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  otherId: z.coerce.number().int().positive(),
});

router.get(
  "/badges",
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const badges = await badgeService.listBadgesForUser(req.user.userId);
    return res.json(badges);
  }),
);

router.post(
  "/badges/unlock",
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const unlockedBadges = await badgeService.checkAndUnlockBadges(req.user.userId);
    return res.json({ message: `Unlocked ${unlockedBadges.length} badges`, badges: unlockedBadges });
  }),
);

router.get(
  "/achievements",
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const achievements = await achievementService.listAchievementsForUser(req.user.userId);
    return res.json(achievements);
  }),
);

router.get(
  "/leaderboard/by-skill/:skillCode",
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = skillCodeParamSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new ValidationError("Invalid skill code", { issues: parsed.error.issues });
    }

    try {
      const leaderboard = await leaderboardStatsService.getSkillLeaderboard(parsed.data.skillCode);

      if (leaderboard.length === 0) {
        logger.warn({ skillCode: parsed.data.skillCode }, "No leaderboard entries found");
        return res.json([]);
      }

      const payload = leaderboard.map((entry, idx) => ({
        rank: idx + 1,
        userId: entry.userId,
        userName: entry.user?.name ?? "Unknown player",
        skillXp: entry.totalXp ?? 0,
        masteryLevel: entry.currentTier ?? 1,
        level: entry.currentTier ?? 1,
      }));

      logger.info({ skillCode: parsed.data.skillCode, count: payload.length }, "Leaderboard fetched");
      return res.json(payload);
    } catch (error) {
      logger.error({ error, skillCode: parsed.data.skillCode }, "Failed to fetch leaderboard");
      throw new NotFoundError(`Leaderboard for skill ${parsed.data.skillCode}`);
    }
  }),
);

router.get(
  "/leaderboard/trending",
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      const trending = await leaderboardStatsService.getTrending();
      const payload = trending.map((stat, idx) => ({
        rank: idx + 1,
        userId: stat.userId,
        userName: stat.user?.name ?? "Unknown player",
        xpPerDay: stat.xpPerDay,
        trend: stat.xpTrend,
        maxStreak: stat.maxStreak,
      }));

      logger.info({ count: payload.length }, "Trending leaderboard fetched");
      return res.json(payload);
    } catch (error) {
      logger.error({ error }, "Failed to fetch trending leaderboard");
      throw new NotFoundError("Trending leaderboard");
    }
  }),
);

router.get(
  "/players/:id/compare/:otherId",
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = compareParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new ValidationError("Invalid player ids", { issues: parsed.error.issues });
    }

    const { id, otherId } = parsed.data;

    if (id === otherId) {
      throw new ValidationError("Cannot compare player with self");
    }

    try {
      const comparison = await leaderboardStatsService.getComparison(id, otherId);
      if (!comparison) {
        throw new NotFoundError("Comparison");
      }

      logger.info({ id, otherId }, "Player comparison fetched");
      return res.json(comparison);
    } catch (error) {
      logger.error({ error, id, otherId }, "Failed to fetch player comparison");
      throw new NotFoundError("Comparison");
    }
  }),
);

export default router;
