import { Request, Response, NextFunction } from "express";
import { HttpError } from "./errors.js";
import logger from "../lib/logger.js";

/**
 * Global error handler middleware – MUSÍ BÝT POSLEDNÍ!
 */
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  const requestId = (req as any).requestId || "unknown";

  if (err instanceof HttpError) {
    logger.warn({
      message: "HTTP error",
      requestId,
      method: req.method,
      path: req.path,
      statusCode: err.statusCode,
      code: err.code,
      error: err.message,
      details: err.details,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });

    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      statusCode: err.statusCode,
      ...(err.details && { details: err.details }),
      timestamp: new Date().toISOString(),
      requestId,
    });
  }

  logger.error({
    message: "Unhandled error",
    requestId,
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    success: false,
    error: "Internal server error",
    code: "INTERNAL_ERROR",
    statusCode: 500,
    timestamp: new Date().toISOString(),
    requestId,
  });
}

/**
 * Wrapper pro async route handlers – aby chytil rejected promises
 * Použití: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
