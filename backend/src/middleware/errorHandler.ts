import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import logger from "../lib/logger.js";
import { config } from "../config.js";

export class HttpError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = err instanceof HttpError ? err.statusCode : 500;
  const requestId = (req as Request & { requestId?: string }).requestId;

  if (err instanceof ZodError) {
    logger.warn({
      message: "validation_error",
      issues: err.issues,
      requestId,
    });
    return res.status(400).json({
      error: "Validation error",
      code: 400,
      issues: err.issues,
      requestId,
    });
  }

  if (err instanceof HttpError) {
    logger.error({
      message: err.message,
      details: err.details,
      requestId,
    });
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.statusCode,
      details: err.details,
      requestId,
    });
  }

  logger.error({ message: "unhandled_error", error: err, requestId });
  return res.status(statusCode).json({
    error: "Internal server error",
    code: statusCode,
    requestId,
    ...(config.env !== "production" && err instanceof Error
      ? { stack: err.stack }
      : {}),
  });
}
