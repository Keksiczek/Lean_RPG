import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { RequestHandler } from "express";
import { getRedis } from "../lib/redis.js";

const redisClient = getRedis();

function createLimiter(max: number, windowMs: number, message: string): RequestHandler {
  return rateLimit({
    store: new RedisStore({ client: redisClient as any }),
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
  });
}

export const globalRateLimiter = createLimiter(100, 60 * 1000, "Too many requests, please slow down");
export const authRateLimiter = createLimiter(5, 60 * 1000, "Too many authentication attempts, try again later");
export const submissionRateLimiter = createLimiter(10, 60 * 1000, "Too many submissions, slow down");
