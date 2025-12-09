import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { HttpError } from "../middleware/errorHandler.js";
import { enqueueGeminiAnalysisJob } from "../queue/geminiJobs.js";

const router = Router();

const submissionSchema = z.object({
  questId: z.coerce.number().int(),
  content: z.string().min(1).max(5000),
});

router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new HttpError("Unauthorized", 401);
    }

    const { questId, content } = submissionSchema.parse(req.body);

    const quest = await prisma.quest.findUnique({ where: { id: questId } });

    if (!quest || !quest.isActive) {
      throw new HttpError("Quest not found", 404);
    }

    const submission = await prisma.submission.create({
      data: {
        questId,
        content,
        userId: req.user.userId,
        status: "pending_analysis",
      },
    });

    const job = await enqueueGeminiAnalysisJob({
      submissionId: submission.id,
      requestId: req.requestId,
    });

    return res.status(202).json({
      success: true,
      submissionId: submission.id,
      jobId: job.id,
      status: submission.status,
      pollUrl: `/api/submissions/${submission.id}`,
    });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new HttpError("Unauthorized", 401);
    }

    const submissionId = Number(req.params.id);
    if (Number.isNaN(submissionId)) {
      throw new HttpError("Invalid submission id", 400);
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        quest: true,
        user: true,
        userQuest: { include: { quest: true, user: true } },
        workstation: { include: { area: true } },
      },
    });

    if (!submission) {
      throw new HttpError("Submission not found", 404);
    }

    const isOwner = submission.userId === req.user.userId;
    const isElevated = req.user.role === "admin" || req.user.role === "ci";

    if (!isOwner && !isElevated) {
      throw new HttpError("Forbidden", 403);
    }

    return res.json(submission);
  })
);

export default router;
