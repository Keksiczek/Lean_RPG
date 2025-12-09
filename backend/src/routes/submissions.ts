import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import {
  ForbiddenError,
  HttpError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../middleware/errors.js";
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
      throw new UnauthorizedError("Please log in to submit solutions");
    }

    let parsedData;
    try {
      parsedData = submissionSchema.parse(req.body);
    } catch (validationErr) {
      if (validationErr instanceof z.ZodError) {
        throw new ValidationError("Invalid submission format", {
          issues: validationErr.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      throw validationErr;
    }

    const { questId, content } = parsedData;

    const quest = await prisma.quest.findUnique({ where: { id: questId } });

    if (!quest) {
      throw new NotFoundError("Quest");
    }

    if (!quest.isActive) {
      throw new HttpError(
        "This quest is no longer active. Check back later for new challenges!",
        410
      );
    }

    const submission = await (prisma as any).submission.create({
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
        503,
        "QUEUE_UNAVAILABLE"
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
      throw new UnauthorizedError("Please log in to view submissions");
    }

    const submissionId = Number(req.params.id);
    if (Number.isNaN(submissionId)) {
      throw new ValidationError("Invalid submission ID format", {
        submissionId: req.params.id,
      });
    }

    const submission = await (prisma as any).submission.findUnique({
      where: { id: submissionId },
      include: {
        quest: true,
        user: true,
        userQuest: { include: { quest: true, user: true } },
        workstation: { include: { area: true } },
      },
    });

    if (!submission) {
      throw new NotFoundError("Submission");
    }

    const isOwner = submission.userId === req.user.userId;
    const isElevated = req.user.role === "admin" || req.user.role === "ci";

    if (!isOwner && !isElevated) {
      throw new ForbiddenError("You do not have permission to view this submission.");
    }

    return res.json(submission);
  })
);

export default router;
