import { Router, Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { ForbiddenError, UnauthorizedError, ValidationError } from "../middleware/errors.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    const areas = await prisma.area.findMany({
      include: {
        workstations: true,
        quests: true,
        knowledgePacks: true,
      },
    });
    return res.json(areas);
  })
);

router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    if (req.user.role !== "admin") {
      throw new ForbiddenError();
    }

    const { name, description } = req.body as { name?: string; description?: string };

    if (!name) {
      throw new ValidationError("Name is required");
    }

    const area = await prisma.area.create({
      data: {
        name,
        description,
      },
    });

    return res.status(201).json(area);
  })
);

export default router;
