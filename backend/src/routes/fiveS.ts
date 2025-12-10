import { Router, Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler.js";
import { ValidationError } from "../middleware/errors.js";
import { ensureUser } from "../services/gembaService.js";
import {
  addProblem,
  getAuditDetail,
  getAuditHistory,
  startAudit,
  submitAudit,
} from "../services/fiveSService.js";
import { exportAuditReport, getLeaderboard, getSetting } from "../services/fiveSDataService.js";
import { progressionService } from "../services/progressionService.js";
import { achievementService } from "../services/achievementService.js";
import { badgeService } from "../services/badgeService.js";
import { leaderboardStatsService } from "../services/leaderboardStatsService.js";
import prisma from "../lib/prisma.js";

const router = Router();

const answerSchema = z.object({ value: z.enum(["yes", "no", "not_sure"]) });

const submissionSchema = z.object({
  answers: z.object({
    sort: z.array(answerSchema),
    order: z.array(answerSchema),
    shine: z.array(answerSchema),
    standardize: z.array(answerSchema),
    sustain: z.array(answerSchema),
  }),
  problems: z
    .array(
      z.object({
        position: z.string().min(2),
        description: z.string().min(2),
        screenshot: z.string().optional(),
        category: z.string(),
        severity: z.enum(["low", "medium", "high"]),
      })
    )
    .optional()
    .default([]),
  timeSpent: z.number().int().positive().optional(),
});

const problemSchema = z.object({
  position: z.string().min(2),
  description: z.string().min(2),
  screenshot: z.string().optional(),
  category: z.string(),
  severity: z.enum(["low", "medium", "high"]),
});

router.get(
  "/settings/:areaId",
  asyncHandler(async (req: Request, res: Response) => {
    const areaId = Number(req.params.areaId);
    const setting = await getSetting(areaId);

    if (!setting) {
      throw new ValidationError("No 5S checklist configured for this area");
    }

    res.json(setting);
  })
);

router.post(
  "/audits",
  asyncHandler(async (req: Request, res: Response) => {
    const user = await ensureUser(req.user);
    const areaId = Number(req.body.areaId);

    if (!areaId) {
      throw new ValidationError("areaId is required to start an audit");
    }

    const audit = await startAudit(user.id, areaId);
    res.status(201).json({ audit });
  })
);

router.get(
  "/audits/:auditId",
  asyncHandler(async (req: Request, res: Response) => {
    const user = await ensureUser(req.user);
    const auditId = Number(req.params.auditId);
    const audit = await getAuditDetail(auditId, user.id);

    if (!audit) {
      throw new ValidationError("Audit not found");
    }

    res.json(audit);
  })
);

router.post(
  "/audits/:auditId/submit",
  asyncHandler(async (req: Request, res: Response) => {
    const user = await ensureUser(req.user);
    const auditId = Number(req.params.auditId);

    const parsed = submissionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid submission payload", parsed.error.flatten());
    }

    const result = await submitAudit(
      auditId,
      user.id,
      parsed.data.answers,
      parsed.data.problems,
      parsed.data.timeSpent
    );
    const xpEarned = result.xpGain ?? Math.floor((result.totalScore ?? 0) / 2);

    if (xpEarned > 0) {
      await progressionService.addXp(user.id, xpEarned);
    }

    const auditCount = await prisma.fiveSAudit.count({ where: { userId: user.id } });
    const achieved = await achievementService.updateAchievementProgress(
      user.id,
      "audits_completed",
      auditCount,
    );

    const badges = await badgeService.checkAndUnlockBadges(user.id);
    await leaderboardStatsService.updateStats(user.id);

    res.json({
      ...result,
      xpEarned,
      achievementsProgressed: achieved.length,
      badgesUnlocked: badges.length,
      badges,
    });
  })
);

router.post(
  "/audits/:auditId/problem",
  asyncHandler(async (req: Request, res: Response) => {
    const user = await ensureUser(req.user);
    const auditId = Number(req.params.auditId);
    const parsed = problemSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new ValidationError("Invalid problem payload", parsed.error.flatten());
    }

    const saved = await addProblem(auditId, user.id, parsed.data);
    res.status(201).json(saved);
  })
);

router.get(
  "/audits/user/:userId",
  asyncHandler(async (req: Request, res: Response) => {
    const user = await ensureUser(req.user);
    const requestedUserId = Number(req.params.userId);

    if (requestedUserId !== user.id) {
      throw new ValidationError("You can only view your own audit history");
    }

    const audits = await getAuditHistory(user.id);
    res.json({ audits });
  })
);

router.get(
  "/leaderboard",
  asyncHandler(async (_req: Request, res: Response) => {
    const leaderboard = await getLeaderboard();
    res.json({ leaderboard });
  })
);

router.get(
  "/audits/:auditId/report",
  asyncHandler(async (req: Request, res: Response) => {
    const auditId = Number(req.params.auditId);
    const report = await exportAuditReport(auditId);

    if (!report) {
      throw new ValidationError("Report not available");
    }

    res.json(report);
  })
);

export default router;
