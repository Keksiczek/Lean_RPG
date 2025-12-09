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
      throw new HttpError(
        "Authentication required. Please log in to submit solutions.",
        401
      );
    }

    let parsedData;
    try {
      parsedData = submissionSchema.parse(req.body);
    } catch (validationErr) {
      throw new HttpError(
        "Invalid submission format. Content must be 1-5000 characters.",
        400
      );
    }

    const { questId, content } = parsedData;

    const quest = await prisma.quest.findUnique({ where: { id: questId } });

    if (!quest) {
      throw new HttpError(
        `Quest #${questId} not found. It may have been archived.`,
        404
      );
    }

    if (!quest.isActive) {
      throw new HttpError(
        "This quest is no longer active. Check back later for new challenges!",
        410
      );
    }

    const submission = await prisma.submission.create({
      data: {
        questId,
        content,
        userId: req.user.userId,
        status: "pending_analysis",
      },
    });

    let job;
    try {
      job = await enqueueGeminiAnalysisJob({
        submissionId: submission.id,
        requestId: req.requestId,
      });
    } catch (queueErr) {
      throw new HttpError(
        "Could not queue analysis. Please try again in a moment.",
        503
      );
    }

    return res.status(202).json({
      success: true,
      submissionId: submission.id,
      jobId: job.id,
      status: submission.status,
      pollUrl: `/api/submissions/${submission.id}`,
      message: "Submission received. Analysis will begin shortly.",
    });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new HttpError("Authentication required", 401);
    }

    const submissionId = Number(req.params.id);
    if (Number.isNaN(submissionId)) {
      throw new HttpError(
        "Invalid submission ID format. Must be a number.",
        400
      );
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
      throw new HttpError(`Submission #${submissionId} not found.`, 404);
    }

    const isOwner = submission.userId === req.user.userId;
    const isElevated = req.user.role === "admin" || req.user.role === "ci";

    if (!isOwner && !isElevated) {
      throw new HttpError(
        "You do not have permission to view this submission.",
        403
      );
    }

    return res.json(submission);
  })
);

export default router;
