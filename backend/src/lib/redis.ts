import Redis from "ioredis";
import { config } from "../config.js";
import logger from "./logger.js";

/**
 * Redis client instance
 * Used for: Bull queue, caching, session store, etc.
 */
let redis: Redis | null = null;

export function getRedis(): Redis {
  if (redis) {
    return redis;
  }

  redis = new Redis(config.redis.url, {
    enableReadyCheck: false,
    enableOfflineQueue: false,
    maxRetriesPerRequest: null, // Required for Bull
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  redis.on("connect", () => {
    logger.info({
      message: "Redis connected",
      url: config.redis.url,
    });
  });

  redis.on("error", (error) => {
    logger.error({
      message: "Redis connection error",
      error: error instanceof Error ? error.message : String(error),
    });
  });

  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

export default getRedis();
