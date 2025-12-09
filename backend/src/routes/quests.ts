import { Router, Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

// Order matters: keep specific prefixes before catch-all parameter routes.
// 1) List all quests
router.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    const quests = await prisma.quest.findMany({ where: { isActive: true } });
    return res.json(quests);
  })
);

// 2) User's quests (must be before parameterised routes like /:id)
router.get(
  "/my",
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const myQuests = await prisma.userQuest.findMany({
      where: { userId: req.user.userId },
      include: { quest: true, submissions: true },
      orderBy: { assignedAt: "desc" },
    });

    return res.json(myQuests);
  })
);

// 3) Legacy assign endpoint
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
        userId: req.user.userId,
        status: "assigned",
      },
      include: { quest: true },
    });

    return res.status(201).json(userQuest);
  })
);

// 4) Accept quest action (keep before /:id catch-all)
router.post(
  "/:id/accept",
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const questId = Number(req.params.id);
    if (Number.isNaN(questId)) {
      return res.status(400).json({ message: "Invalid quest id" });
    }

    const quest = await prisma.quest.findUnique({ where: { id: questId } });
    if (!quest || !quest.isActive) {
      return res.status(404).json({ message: "Quest not found" });
    }

    const existing = await prisma.userQuest.findFirst({
      where: { userId: req.user.userId, questId },
    });

    if (existing) {
      return res.status(409).json({ message: "Already accepted" });
    }

    const userQuest = await prisma.userQuest.create({
      data: {
        userId: req.user.userId,
        questId,
        status: "in_progress",
        acceptedAt: new Date(),
      },
    });

    return res.json(userQuest);
  })
);

// 5) Quest detail (catch-all parameter route, must be last)
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const questId = Number(req.params.id);

    if (Number.isNaN(questId)) {
      return res.status(400).json({ message: "Invalid quest id" });
    }

    const quest = await prisma.quest.findUnique({ where: { id: questId } });

    if (!quest || !quest.isActive) {
      return res.status(404).json({ message: "Quest not found" });
    }

    return res.json(quest);
  })
);

export default router;
