import Redis from "ioredis";
import { config } from "../config.js";
import logger from "./logger.js";

const redis = new Redis(config.redis.url);

redis.on("error", (err) => {
  logger.error({ message: "redis_error", error: err });
});

export default redis;
