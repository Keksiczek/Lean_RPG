import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import {
  ForbiddenError,
  HttpError,
  NotFoundError,
  UnauthorizedError,
} from "../middleware/errors.js";
import { validateBody, validateParams } from "../middleware/validation.js";
import { enqueueSubmissionAnalysis } from "../queue/queueFactory.js";
import { getJobStatus } from "../queue/submissionWorker.js";
import { validateBody, validateParams } from "../middleware/validation.js";

const router = Router();

const submissionSchema = z.object({
  questId: z.coerce.number().int(),
  content: z.string().min(1).max(5000),
});

router.post(
  "/",
  validateBody(submissionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError("Please log in to submit solutions");
    }

    const { questId, content } = req.validated!.body as z.infer<typeof submissionSchema>;

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
        status: "queued",
      },
    });

    // ASYNC: Enqueue job instead of processing synchronously
    try {
      const job = await enqueueSubmissionAnalysis({
        submissionId: submission.id,
        requestId: req.requestId,
        userId: req.user.userId,
        questId: submission.questId,
        metadata: {
          enqueuedAt: new Date().toISOString(),
        },
      });

      // Return 202 Accepted with job info
      return res.status(202).json({
        success: true,
        submissionId: submission.id,
        status: submission.status,
        jobId: job.id,
        message: "Submission queued for analysis",
        statusUrl: `/api/submissions/${submission.id}`,
        jobStatusUrl: `/api/submissions/${submission.id}/job/${job.id}`,
      });
    } catch (queueErr) {
      throw new HttpError(
        "Could not queue analysis. Please try again in a moment.",
        503,
        "QUEUE_UNAVAILABLE"
      );
    }
  })
);

router.get(
  "/:id",
  validateParams(z.object({ id: z.coerce.number().int() })),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError("Please log in to view submissions");
    }

    const submissionId = (req.validated!.params as { id: number }).id;

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

router.get(
  "/:id/job/:jobId",
  validateParams(z.object({ id: z.coerce.number().int(), jobId: z.string().min(1) })),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError("Please log in to view job status");
    }

    const { id: submissionId, jobId } = req.validated!.params as { id: number; jobId: string };

    const submission = await (prisma as any).submission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      throw new NotFoundError("Submission");
    }

    const isOwner = submission.userId === req.user.userId;
    const isElevated = req.user.role === "admin" || req.user.role === "ci";

    if (!isOwner && !isElevated) {
      throw new ForbiddenError(
        "You do not have permission to view this submission job status."
      );
    }

    const jobStatus = await getJobStatus(jobId);

    if (!jobStatus) {
      throw new NotFoundError(`Job #${req.params.jobId}`);
    }

    return res.json({ job: jobStatus });
  })
);

export default router;
