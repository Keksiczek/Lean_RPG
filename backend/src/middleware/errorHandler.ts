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
  const requestId = (req as Request & { requestId?: string }).requestId;
  const isDev = config.env !== "production";

  let statusCode = 500;
  let errorCode = "INTERNAL_SERVER_ERROR";
  let message = "Internal server error";
  let details: unknown;

  if (err instanceof ZodError) {
    statusCode = 400;
    errorCode = "VALIDATION_ERROR";
    message = "Validation error";
    details = err.issues;

    logger.warn("Validation error", { requestId, context: "error", issues: err.issues });
  } else if (err instanceof HttpError) {
    statusCode = err.statusCode;
    errorCode = `HTTP_${statusCode}`;
    message = err.message;
    details = err.details;

    logger.error("Handled HTTP error", {
      requestId,
      context: "error",
      statusCode,
      message: err.message,
      details,
    });
  } else if (err instanceof Error) {
    message = err.message;
    logger.error("Unhandled error", {
      requestId,
      context: "error",
      statusCode,
      error: err.message,
      stack: isDev ? err.stack : undefined,
    });
  } else {
    logger.error("Unknown error", { requestId, context: "error", error: err });
  }

  res.status(statusCode).json({
    error: message,
    code: errorCode,
    timestamp: new Date().toISOString(),
    requestId,
    ...(details && isDev ? { details } : {}),
  });
}
