import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import questRoutes from "./routes/quests.js";
import submissionRoutes from "./routes/submissions.js";
import userRoutes from "./routes/users.js";
import areaRoutes from "./routes/areas.js";
import { verifyToken } from "./middleware/auth.js";
import { config } from "./config.js";
import { errorHandler, HttpError } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/logger.js";
import { asyncHandler } from "./middleware/asyncHandler.js";
import prisma from "./lib/prisma.js";
import redis from "./lib/redis.js";
import logger from "./lib/logger.js";
import { GeminiService } from "./services/GeminiService.js";
import { registerGeminiProcessor } from "./queue/geminiJobs.js";

const app = express();
const PORT = config.app.port;

app.use(cors());
app.use(express.json());
if (config.logging.enableHttpLogs) {
  app.use(requestLogger);
}

app.get(
  "/health",
  asyncHandler(async (_req, res) => {
    const health = {
      status: "ok" as "ok" | "degraded",
      services: {
        database: "up" as "up" | "down",
        redis: "up" as "up" | "down",
      },
      uptime: process.uptime(),
    };

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      health.status = "degraded";
      health.services.database = "down";
      logger.error({ message: "healthcheck_db_failed", error });
    }

    try {
      await redis.ping();
    } catch (error) {
      health.status = "degraded";
      health.services.redis = "down";
      logger.error({ message: "healthcheck_redis_failed", error });
    }

    res.json(health);
  })
);

app.use("/auth", authRoutes);
app.use("/quests", verifyToken, questRoutes);
app.use("/submissions", verifyToken, submissionRoutes);
app.use("/users", verifyToken, userRoutes);
app.use("/areas", verifyToken, areaRoutes);

const geminiService = new GeminiService();
registerGeminiProcessor(geminiService);

app.use((req, _res, next) => {
  next(new HttpError(`Route not found: ${req.originalUrl}`, 404));
});

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info({ message: "server_started", port: PORT });
});
