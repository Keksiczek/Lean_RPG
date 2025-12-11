import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { Request, RequestHandler } from "express";
import { getRedis } from "../lib/redis.js";
import { config } from "../config.js";
import logger from "../lib/logger.js";

const redisClient = getRedis();

function isHealthCheckPath(req: Request): boolean {
  return req.path === "/health" || req.path.startsWith("/health/") || req.path === "/";
}

function isRedisUnavailable(): boolean {
  return redisClient.status !== "ready" && redisClient.status !== "connect";
}

function createLimiter(max: number, windowMs: number, message: string, includeRetryAfter = false): RequestHandler {
  const retryAfterSeconds = Math.ceil(windowMs / 1000);

  return rateLimit({
    store: new RedisStore({ client: redisClient as any }),
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isHealthCheckPath(req) || isRedisUnavailable(),
    handler: (req, res) => {
      logger.warn("Rate limit exceeded", {
        context: "rate-limiter",
        ip: req.ip,
        path: req.path,
        method: req.method,
        limit: max,
        window: windowMs,
      });

      const payload: { status: number; error: string; retryAfter?: number } = {
        status: 429,
        error: message,
      };

      if (includeRetryAfter) {
        payload.retryAfter = retryAfterSeconds;
      }

      res.status(429).json(payload);
    },
  });
}

export const globalRateLimiter = createLimiter(
  config.rateLimit.global,
  config.rateLimit.windowMs,
  "Too many requests, please slow down",
  true
);

export const authRateLimiter = createLimiter(
  config.rateLimit.auth,
  config.rateLimit.windowMs,
  "Too many authentication attempts, try again later"
);

export const submissionRateLimiter = createLimiter(
  config.rateLimit.submission,
  config.rateLimit.windowMs,
  "Too many submissions, slow down"
);
