import { Router, Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler.js";
import { ValidationError } from "../middleware/errors.js";
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
  asyncHandler(async (req: Request, res: Response) => {
    const payload = startSchema.parse(req.body);
    const analysis = await startAnalysis(req.user!.id, payload.challengeId, payload);
    res.status(201).json(analysis);
  })
);

router.get(
  "/analyses/:analysisId",
  asyncHandler(async (req: Request, res: Response) => {
    const analysisId = Number(req.params.analysisId);
    const analysis = await getAnalysis(analysisId);
    if (!analysis) {
      throw new ValidationError("Analysis not found");
    }
    res.json(analysis);
  })
);

router.post(
  "/analyses/:analysisId/submit",
  asyncHandler(async (req: Request, res: Response) => {
    const analysisId = Number(req.params.analysisId);
    const payload = updateSchema.parse(req.body);
    const analysis = await submitAnalysis(analysisId, req.user!.id, payload);
    const xpEarned = analysis.xpGain ?? Math.floor((analysis.totalScore ?? 0) / 2);

    if (xpEarned > 0) {
      await progressionService.addXp(req.user!.id, xpEarned);
    }

    const completedCount = await prisma.problemAnalysis.count({
      where: { userId: req.user!.id, status: "evaluated" },
    });

    const achieved = await achievementService.updateAchievementProgress(
      req.user!.id,
      "ishikawa_completed",
      completedCount,
    );

    const badges = await badgeService.checkAndUnlockBadges(req.user!.id);
    await leaderboardStatsService.updateStats(req.user!.id);

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
  asyncHandler(async (req: Request, res: Response) => {
    const analysisId = Number(req.params.analysisId);
    const payload = updateSchema.parse(req.body);
    const analysis = await updateAnalysis(analysisId, payload);
    res.json(analysis);
  })
);

router.get(
  "/history",
  asyncHandler(async (req: Request, res: Response) => {
    const history = await getHistory(req.user!.id);
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
