import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import logger from "../lib/logger.js";

declare module "express-serve-static-core" {
  interface Request {
    requestId?: string;
  }
}

/**
 * Middleware: Přidej requestId ke každému requestu + loguj HTTP metadata
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = (req.headers["x-request-id"] as string) || uuidv4();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  const startTime = Date.now();

  logger.info({
    message: "HTTP request",
    requestId,
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length ? req.query : undefined,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const level = statusCode >= 400 ? "warn" : "info";

    logger.log({
      level,
      message: "HTTP response",
      requestId,
      method: req.method,
      path: req.path,
      statusCode,
      duration_ms: duration,
    });
  });

  next();
}
