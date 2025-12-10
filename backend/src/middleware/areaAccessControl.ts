import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";
import { ForbiddenError, UnauthorizedError } from "./errors.js";

export function requireAreaAccess(minLevel: number) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { level: true },
    });

    if (!user) {
      return next(new UnauthorizedError());
    }

    if (user.level < minLevel) {
      return next(new ForbiddenError(`Area locked - need level ${minLevel}`));
    }

    return next();
  };
}
