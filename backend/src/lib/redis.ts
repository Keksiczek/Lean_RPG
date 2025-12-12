import Redis from "ioredis";
import { config } from "../config.js";
import logger from "./logger.js";

let redis: Redis | null = null;

function attachEventHandlers(client: Redis) {
  client.on("connect", () => {
    logger.info({
      message: "Redis connected",
      url: config.redis.url,
    });
  });

  client.on("ready", () => {
    logger.info({ message: "Redis ready" });
  });

  client.on("end", () => {
    logger.warn({ message: "Redis connection closed" });
  });

  client.on("error", (error) => {
    logger.error({
      message: "Redis connection error",
      error: error instanceof Error ? error.message : String(error),
    });
  });

  client.on("reconnecting", (time) => {
    logger.warn({ message: "Redis reconnecting", delay: time });
  });
}

export function getRedis(): Redis {
  if (redis) {
    return redis;
  }

  redis = new Redis(config.redis.url, {
    enableReadyCheck: false,
    enableOfflineQueue: false,
    maxRetriesPerRequest: null,
    retryStrategy: (times: number) => Math.min(times * 50, 2000),
  });

  attachEventHandlers(redis);
  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

export async function redisGet(key: string): Promise<string | null> {
  try {
    const client = getRedis();
    return await client.get(key);
  } catch (error) {
    logger.error({
      message: "redis_get_failed",
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function redisSet(
  key: string,
  value: string,
  expiryMode?: "EX" | "PX",
  time?: number
): Promise<void> {
  try {
    const client = getRedis();
    if (expiryMode && typeof time === "number") {
      await client.set(key, value, expiryMode, time);
    } else {
      await client.set(key, value);
    }
  } catch (error) {
    logger.error({
      message: "redis_set_failed",
      key,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function redisDel(key: string): Promise<void> {
  try {
    const client = getRedis();
    await client.del(key);
  } catch (error) {
    logger.error({
      message: "redis_del_failed",
      key,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function redisFlushAll(): Promise<void> {
  try {
    const client = getRedis();
    await client.flushall();
  } catch (error) {
    logger.error({
      message: "redis_flush_failed",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
