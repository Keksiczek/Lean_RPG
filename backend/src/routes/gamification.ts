import { Request, Response, Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler.js";
import { UnauthorizedError, ValidationError, NotFoundError } from "../middleware/errors.js";
import { badgeService } from "../services/badgeService.js";
import { achievementService } from "../services/achievementService.js";
import { leaderboardStatsService } from "../services/leaderboardStatsService.js";

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

    const leaderboard = await leaderboardStatsService.getSkillLeaderboard(parsed.data.skillCode);
    const payload = leaderboard.map((entry, idx) => ({
      rank: idx + 1,
      userId: entry.userId,
      userName: entry.user.name,
      skillXp: entry.skillXp,
      masteryLevel: entry.masteryLevel,
      level: entry.level,
    }));

    return res.json(payload);
  }),
);

router.get(
  "/leaderboard/trending",
  asyncHandler(async (_req: Request, res: Response) => {
    const trending = await leaderboardStatsService.getTrending();
    const payload = trending.map((stat, idx) => ({
      rank: idx + 1,
      userId: stat.userId,
      userName: stat.user.name,
      xpPerDay: stat.xpPerDay,
      trend: stat.xpTrend,
      maxStreak: stat.maxStreak,
    }));

    return res.json(payload);
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

    const comparison = await leaderboardStatsService.getComparison(id, otherId);
    if (!comparison) {
      throw new NotFoundError("Comparison");
    }

    return res.json(comparison);
  }),
);

export default router;
