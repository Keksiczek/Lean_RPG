import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { HttpError } from "./errors.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      userId: number;
      role: string;
      email?: string;
    };
  }
}

const JWT_SECRET = config.auth.jwtSecret;

export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return next(new HttpError("Missing token", 401));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      email: string;
      role: string;
    };

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (err) {
    return next(new HttpError("Invalid token", 401));
  }
}

export function adminCheck(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new HttpError("Missing token", 401, "UNAUTHORIZED"));
  }

  if (req.user.role !== "admin") {
    return next(new HttpError("Admin access required", 403, "FORBIDDEN"));
  }

  return next();
}
