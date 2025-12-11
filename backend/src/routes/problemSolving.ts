import { Router, Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler.js";
import { ValidationError } from "../middleware/errors.js";
import { validateBody, validateParams } from "../middleware/validation.js";
import {
  getAnalysis,
  getChallenge,
  getChallengesByArea,
  getHistory,
  getLeaderboard,
  startAnalysis,
  submitAnalysis,
  updateAnalysis,
} from "../services/problemSolvingService.js";
import { progressionService } from "../services/progressionService.js";
import { achievementService } from "../services/achievementService.js";
import { badgeService } from "../services/badgeService.js";
import { leaderboardStatsService } from "../services/leaderboardStatsService.js";
import { GameCompletionResponse } from "../types/gamification.js";
import prisma from "../lib/prisma.js";
import { validateBody, validateParams } from "../middleware/validation.js";

const router = Router();

const startSchema = z.object({
  challengeId: z.number(),
  selectedCategories: z.any().optional(),
  causes: z.any().optional(),
});

const updateSchema = z.object({
  selectedCategories: z.any().optional(),
  causes: z.any().optional(),
  rootCauseId: z.number().optional(),
  rootCause: z.string().optional(),
  proposedSolution: z.string().optional(),
  solutionDetails: z.string().optional(),
  solutionQuality: z.string().optional(),
  timeSpent: z.number().optional(),
});

router.get(
  "/challenges/area/:areaId",
  asyncHandler(async (req: Request, res: Response) => {
    const areaId = Number(req.params.areaId);
    const challenges = await getChallengesByArea(areaId);
    res.json({ challenges });
  })
);

router.get(
  "/challenges/:challengeId",
  asyncHandler(async (req: Request, res: Response) => {
    const challengeId = Number(req.params.challengeId);
    const challenge = await getChallenge(challengeId);
    if (!challenge) {
      throw new ValidationError("Challenge not found");
    }
    res.json(challenge);
  })
);

router.post(
  "/analyses",
  validateBody(startSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const payload = req.validated!.body as z.infer<typeof startSchema>;
    const analysis = await startAnalysis(req.user!.userId, payload.challengeId, payload);
    res.status(201).json(analysis);
  })
);

router.get(
  "/analyses/:analysisId",
  validateParams(z.object({ analysisId: z.coerce.number().int().positive() })),
  asyncHandler(async (req: Request, res: Response) => {
    const { analysisId } = req.validated!.params as { analysisId: number };
    const analysis = await getAnalysis(analysisId);
    if (!analysis) {
      throw new ValidationError("Analysis not found");
    }
    res.json(analysis);
  })
);

router.post(
  "/analyses/:analysisId/submit",
  validateParams(z.object({ analysisId: z.coerce.number().int().positive() })),
  validateBody(updateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { analysisId } = req.validated!.params as { analysisId: number };
    const payload = req.validated!.body as z.infer<typeof updateSchema>;
    const analysis = await submitAnalysis(analysisId, req.user!.userId, payload);
    const xpEarned = analysis.xpGain ?? Math.floor((analysis.totalScore ?? 0) / 2);

    if (xpEarned > 0) {
      await progressionService.addXp(req.user!.userId, xpEarned);
    }

    const completedCount = await prisma.problemAnalysis.count({
      where: { userId: req.user!.userId, status: "evaluated" },
    });

    const achieved = await achievementService.updateAchievementProgress(
      req.user!.userId,
      "ishikawa_completed",
      completedCount,
    );

    const badges = await badgeService.checkAndUnlockBadges(req.user!.userId);
    await leaderboardStatsService.updateStats(req.user!.userId);

    const response: GameCompletionResponse<typeof analysis> = {
      ...analysis,
      xpEarned,
      achievementsProgressed: achieved.length,
      badgesUnlocked: badges.length,
      badges,
    };

    res.json(response);
  })
);

router.patch(
  "/analyses/:analysisId",
  validateParams(z.object({ analysisId: z.coerce.number().int().positive() })),
  validateBody(updateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { analysisId } = req.validatedParams as { analysisId: number };
    const payload = req.validatedBody as z.infer<typeof updateSchema>;
    const analysis = await updateAnalysis(analysisId, payload);
    res.json(analysis);
  })
);

router.get(
  "/history",
  asyncHandler(async (req: Request, res: Response) => {
    const history = await getHistory(req.user!.userId);
    res.json({ history });
  })
);

router.get(
  "/leaderboard",
  asyncHandler(async (_req: Request, res: Response) => {
    const leaderboard = await getLeaderboard();
    res.json({ leaderboard });
  })
);

export default router;
