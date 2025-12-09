import { Router, Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

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
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { name, description } = req.body as { name?: string; description?: string };

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
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
