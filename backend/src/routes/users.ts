import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { NotFoundError, UnauthorizedError } from "../middleware/errors.js";

const router = Router();

const updateUserSchema = z
  .object({
    name: z.string().min(1).optional(),
  })
  .refine((data) => data.name !== undefined, {
    message: "No updates provided",
  });

function formatUser(user: {
  id: number;
  email: string;
  name: string;
  role: string;
  totalXp: number;
  level: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    totalXp: user.totalXp,
    level: user.level,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

router.get(
  "/me",
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) {
      throw new NotFoundError("User");
    }

    return res.json(formatUser(user));
  })
);

router.put(
  "/me",
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const { name } = updateUserSchema.parse(req.body);

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        ...(name ? { name } : {}),
      },
    });

    return res.json(formatUser(updatedUser));
  })
);

export default router;
