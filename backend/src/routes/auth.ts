import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { config } from "../config.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { HttpError, NotFoundError, UnauthorizedError } from "../middleware/errors.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();
const JWT_SECRET = config.auth.jwtSecret;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function generateToken(payload: { userId: number; role: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

function toUserResponse(user: {
  id: number;
  email: string;
  name: string;
  role: string;
  totalXp: number;
  level: number;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    totalXp: user.totalXp,
    level: user.level,
    createdAt: user.createdAt.toISOString(),
  };
}

router.post(
  "/register",
  limiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name } = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new HttpError("User already exists", 409, "USER_EXISTS");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: "operator",
        totalXp: 0,
        level: 1,
      },
    });

    const token = generateToken({ userId: user.id, role: user.role });

    return res.status(201).json({
      user: toUserResponse(user),
      token,
    });
  })
);

router.post(
  "/login",
  limiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new HttpError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new HttpError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    const token = generateToken({ userId: user.id, role: user.role });

    return res.json({
      user: toUserResponse(user),
      token,
    });
  })
);

router.get(
  "/me",
  verifyToken,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) {
      throw new NotFoundError("User");
    }

    return res.json({ user: toUserResponse(user) });
  })
);

export default router;
