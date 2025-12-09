import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { analyzeSubmissionWithGemini } from "../lib/gemini.js";
import { calculateXpGainForSubmission } from "../lib/xp.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

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
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = submissionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Invalid input", errors: parsed.error.flatten() });
  }

  const { userQuestId, workstationId, textInput = null, imageUrl = null } = parsed.data;

  const userQuest = await prisma.userQuest.findUnique({
    where: { id: userQuestId },
    include: { quest: true },
  });
  if (!userQuest || userQuest.userId !== req.user.id) {
    return res.status(403).json({ message: "Not allowed to submit for this quest" });
  }

  const workstation = await prisma.workstation.findUnique({
    where: { id: workstationId },
    include: { area: { include: { knowledgePacks: true } } },
  });

  if (!workstation) {
    return res.status(404).json({ message: "Workstation not found" });
  }

  const areaContext = workstation.area?.knowledgePacks?.[0]?.content ?? null;

  const submission = await prisma.submission.create({
    data: {
      userQuestId,
      workstationId,
      textInput,
      imageUrl,
    },
  });

  const analysis = await analyzeSubmissionWithGemini({
    textInput,
    imageUrl,
    areaContext,
  });

  const xpGain = calculateXpGainForSubmission({
    baseXp: userQuest.quest.baseXp,
    score5s: analysis.score5s,
    riskLevel: analysis.riskLevel,
  });

  const updatedSubmission = await prisma.$transaction(async (tx) => {
    const submissionWithAi = await tx.submission.update({
      where: { id: submission.id },
      data: {
        aiFeedback: analysis.feedback,
        aiScore5s: analysis.score5s,
        aiRiskLevel: analysis.riskLevel,
        xpGain,
      },
    });

    await tx.userQuest.update({
      where: { id: userQuestId },
      data: { status: "evaluated" },
    });

    await tx.xpLog.create({
      data: {
        userId: req.user.id,
        source: "submission",
        xpChange: xpGain,
        note: `Quest ${userQuest.quest.title} submission evaluated`,
      },
    });

    await tx.user.update({
      where: { id: req.user.id },
      data: { totalXp: { increment: xpGain } },
    });

    return submissionWithAi;
  });

  return res.status(201).json(updatedSubmission);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const submissionId = Number(req.params.id);
  if (Number.isNaN(submissionId)) {
    return res.status(400).json({ message: "Invalid submission id" });
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      userQuest: { include: { quest: true, user: true } },
      workstation: { include: { area: true } },
    },
  });

  if (!submission) {
    return res.status(404).json({ message: "Submission not found" });
  }

  const isOwner = submission.userQuest.userId === req.user.id;
  const isElevated = req.user.role === "admin" || req.user.role === "ci";

  if (!isOwner && !isElevated) {
    return res.status(403).json({ message: "Forbidden" });
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
