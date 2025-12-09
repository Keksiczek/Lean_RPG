import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import logger from "../lib/logger.js";

declare module "express-serve-static-core" {
  interface Request {
    requestId?: string;
  }
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = uuidv4();
  req.requestId = requestId;
  res.locals.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  const startTime = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;
    logger.info({
      message: "request_completed",
      requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs,
    });
  });

  next();
}
