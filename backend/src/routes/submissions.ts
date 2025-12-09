import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { HttpError } from "../middleware/errorHandler.js";
import { enqueueGeminiAnalysisJob } from "../queue/geminiJobs.js";

const router = Router();

const submissionSchema = z.object({
  userQuestId: z.coerce.number().int(),
  workstationId: z.coerce.number().int(),
  textInput: z.string().max(2000).optional().nullable(),
  imageUrl: z.string().url().max(2000).optional().nullable(),
});

router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new HttpError("Unauthorized", 401);
    }

    const { userQuestId, workstationId, textInput = null, imageUrl = null } =
      submissionSchema.parse(req.body);

    const userQuest = await prisma.userQuest.findUnique({
      where: { id: userQuestId },
      include: { quest: true },
    });
    if (!userQuest || userQuest.userId !== req.user.userId) {
      throw new HttpError("Not allowed to submit for this quest", 403);
    }

    const workstation = await prisma.workstation.findUnique({
      where: { id: workstationId },
      include: { area: { include: { knowledgePacks: true } } },
    });

    if (!workstation) {
      throw new HttpError("Workstation not found", 404);
    }

    const submission = await prisma.submission.create({
      data: {
        userQuestId,
        workstationId,
        textInput,
        imageUrl,
        status: "pending_analysis",
      },
    });

    await enqueueGeminiAnalysisJob({
      submissionId: submission.id,
      requestId: req.requestId,
    });

    return res.status(202).json({ ...submission, status: submission.status });
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
        userQuest: { include: { quest: true, user: true } },
        workstation: { include: { area: true } },
      },
    });

    if (!submission) {
      throw new HttpError("Submission not found", 404);
    }

    const isOwner = submission.userQuest.userId === req.user.userId;
    const isElevated = req.user.role === "admin" || req.user.role === "ci";

    if (!isOwner && !isElevated) {
      throw new HttpError("Forbidden", 403);
    }

    let xpGain = submission.xpGain ?? null;

    if (xpGain === null) {
      const relatedLog = await prisma.xpLog.findFirst({
        where: {
          userId: submission.userQuest.userId,
          source: "submission",
          createdAt: submission.createdAt,
        },
      });
      xpGain = relatedLog?.xpChange ?? null;
    }

    return res.json({
      ...submission,
      xpGain,
    });
  })
);

export default router;
