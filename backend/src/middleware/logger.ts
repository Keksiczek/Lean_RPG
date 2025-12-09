import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import logger from "../lib/logger.js";

declare module "express-serve-static-core" {
  interface Request {
    requestId?: string;
    startTime?: number;
  }
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  req.requestId = req.requestId ?? randomUUID();
  res.locals.requestId = req.requestId;
  res.setHeader("X-Request-Id", req.requestId ?? "");

  // Skip verbose logging for health checks
  if (req.path === "/health") {
    return next();
  }

  req.startTime = Date.now();

  logger.info("Incoming request", {
    requestId: req.requestId,
    context: "request",
    method: req.method,
    url: req.originalUrl,
  });

  res.on("finish", () => {
    const durationMs = req.startTime ? Date.now() - req.startTime : undefined;
    logger.info("Request completed", {
      requestId: req.requestId,
      context: "response",
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs,
    });
  });

  next();
}
