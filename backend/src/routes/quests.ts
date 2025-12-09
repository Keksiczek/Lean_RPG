import { Router, Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    const quests = await prisma.quest.findMany({ where: { isActive: true } });
    return res.json(quests);
  })
);

router.post(
  "/assign",
  asyncHandler(async (req: Request, res: Response) => {
    const { questId } = req.body as { questId?: number };

  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!questId) {
    return res.status(400).json({ message: "questId is required" });
  }

  const quest = await prisma.quest.findUnique({ where: { id: questId } });
  if (!quest) {
    return res.status(404).json({ message: "Quest not found" });
  }

  const userQuest = await prisma.userQuest.create({
    data: {
      questId,
      userId: req.user.id,
      status: "assigned",
    },
    include: { quest: true },
  });

  return res.status(201).json(userQuest);
  })
);

router.get(
  "/my",
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const myQuests = await prisma.userQuest.findMany({
      where: { userId: req.user.id },
      include: { quest: true, submissions: true },
      orderBy: { assignedAt: "desc" },
    });

    return res.json(myQuests);
  })
);

export default router;
