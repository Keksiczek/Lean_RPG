import express from "express";
import cors from "cors";
import { config } from "./config.js";
import logger from "./lib/logger.js";
import { getRedis, closeRedis } from "./lib/redis.js";
import { startSubmissionWorker } from "./queue/submissionWorker.js";
import { getSubmissionQueue, closeQueue } from "./queue/queueFactory.js";
import { requestLogger } from "./middleware/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { verifyToken } from "./middleware/auth.js";

// Routes
import authRoutes from "./routes/auth.js";
import questRoutes from "./routes/quests.js";
import submissionRoutes from "./routes/submissions.js";
import userRoutes from "./routes/users.js";
import areaRoutes from "./routes/areas.js";
import healthRouter from "./routes/health.js";
import jobsRouter from "./routes/jobs.js";
import gembaRouter from "./routes/gemba.js";
import fiveSRouter from "./routes/fiveS.js";

const app = express();
const PORT = config.app.port;
const HOST = config.app.host;

if (config.logging.enableHttpLogs) {
  app.use(requestLogger);
}

app.use(cors({ origin: config.cors.origin }));
app.use(express.json());

// Public routes
app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use(healthRouter);

// Protected routes
app.use("/quests", verifyToken, questRoutes);
app.use("/submissions", verifyToken, submissionRoutes);
app.use("/users", verifyToken, userRoutes);
app.use("/areas", verifyToken, areaRoutes);
app.use("/api/quests", verifyToken, questRoutes);
app.use("/api/submissions", verifyToken, submissionRoutes);
app.use("/api/users", verifyToken, userRoutes);
app.use("/api/areas", verifyToken, areaRoutes);
app.use("/api/jobs", verifyToken, jobsRouter);
app.use("/api/gemba", verifyToken, gembaRouter);
app.use("/api/5s", verifyToken, fiveSRouter);

app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    code: "NOT_FOUND",
    path: req.path,
  });
});

app.use(errorHandler);

async function startServer() {
  try {
    const redis = getRedis();
    await redis.ping();
    logger.info({ message: "Redis connected" });

    await startSubmissionWorker();
    logger.info("Submission worker started");

    const server = app.listen(PORT, HOST, () => {
      logger.info({
        message: "Server started",
        port: PORT,
        host: HOST,
        environment: config.env,
      });
    });

    const shutdown = async (signal: string) => {
      logger.info({
        message: "shutdown_initiated",
        signal,
      });

      server.close(async () => {
        logger.info("HTTP server closed");

        const queue = getSubmissionQueue();
        logger.info("Draining job queue...");
        await queue.drain();
        logger.info("Job queue drained");

        await closeQueue();
        await closeRedis();

        logger.info("Shutdown complete");
        process.exit(0);
      });

      setTimeout(() => {
        logger.error("Forced shutdown after 30s timeout");
        process.exit(1);
      }, 30_000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    logger.error({
      message: "server_startup_failed",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

startServer();

export default app;
