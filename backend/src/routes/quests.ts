import { Router, Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import {
  HttpError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../middleware/errors.js";

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
      throw new UnauthorizedError();
    }

    const myQuests = await prisma.userQuest.findMany({
      where: { userId: req.user.userId },
      include: { quest: true, submissions: true },
      orderBy: { createdAt: "desc" },
    });

    return res.json(myQuests);
  })
);

// 3) Legacy assign endpoint
router.post(
  "/assign",
  asyncHandler(async (req: Request, res: Response) => {
    const { questId } = req.body as { questId?: string };

    if (!req.user) {
      throw new UnauthorizedError();
    }

    if (!questId) {
      throw new ValidationError("questId is required");
    }

    const quest = await prisma.quest.findUnique({ where: { id: questId } });
    if (!quest) {
      throw new NotFoundError("Quest");
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
      throw new UnauthorizedError();
    }

    const questId = req.params.id;
    if (!questId || questId.length === 0) {
      throw new ValidationError("Invalid quest id", { questId: req.params.id });
    }

    const quest = await prisma.quest.findUnique({ where: { id: questId } });
    if (!quest || !quest.isActive) {
      throw new NotFoundError("Quest");
    }

    const existing = await prisma.userQuest.findFirst({
      where: { userId: req.user.userId, questId },
    });

    if (existing) {
      throw new HttpError("Already accepted", 409, "ALREADY_ACCEPTED");
    }

    const userQuest = await prisma.userQuest.create({
      data: {
        userId: req.user.userId,
        questId,
        status: "in_progress",
      },
    });

    return res.json(userQuest);
  })
);

// 5) Quest detail (catch-all parameter route, must be last)
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const questId = req.params.id;

    if (!questId || questId.length === 0) {
      throw new ValidationError("Invalid quest id", { questId: req.params.id });
    }

    const quest = await prisma.quest.findUnique({ where: { id: questId } });

    if (!quest || !quest.isActive) {
      throw new NotFoundError("Quest");
    }

    return res.json(quest);
  })
);

export default router;
