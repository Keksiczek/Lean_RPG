import { Router, Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { calculateLevel } from "../lib/xp.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.get(
  "/me",
  asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const levelInfo = calculateLevel(user.totalXp);

  return res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    totalXp: user.totalXp,
    levelInfo,
  });
  })
);

export default router;
