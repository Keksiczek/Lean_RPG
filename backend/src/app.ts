import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { requestLogger } from "./middleware/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { verifyToken, adminCheck } from "./middleware/auth.js";
import { globalRateLimiter, submissionRateLimiter } from "./middleware/rateLimiter.js";

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
import problemSolvingRouter from "./routes/problemSolving.js";
import skillRouter from "./routes/skills.js";
import progressionRouter from "./routes/progression.js";
import gamificationRouter from "./routes/gamification.js";
import tenantRoutes from "./routes/tenants.js";
import adminTenantRoutes from "./routes/admin/tenants.js";

export function createApp() {
  const app = express();

  if (config.logging.enableHttpLogs) {
    app.use(requestLogger);
  }

  app.set("trust proxy", 1);

  app.use(cors({ origin: config.cors.origin }));
  app.use(express.json());
  app.use(globalRateLimiter);

  // Public routes
  app.use("/auth", authRoutes);
  app.use("/api/auth", authRoutes);
  app.use(healthRouter);

  // Tenant-aware routes
  app.use("/api/tenants", tenantRoutes);

  // Admin routes
  app.use("/api/admin/tenants", verifyToken, adminCheck, adminTenantRoutes);

  // Protected routes
  app.use("/quests", verifyToken, questRoutes);
  app.use("/submissions", verifyToken, submissionRateLimiter, submissionRoutes);
  app.use("/users", verifyToken, userRoutes);
  app.use("/areas", verifyToken, areaRoutes);
  app.use("/api/quests", verifyToken, questRoutes);
  app.use("/api/submissions", verifyToken, submissionRateLimiter, submissionRoutes);
  app.use("/api/users", verifyToken, userRoutes);
  app.use("/api/areas", verifyToken, areaRoutes);
  app.use("/api/jobs", verifyToken, jobsRouter);
  app.use("/api/gemba", verifyToken, gembaRouter);
  app.use("/api/5s", verifyToken, fiveSRouter);
  app.use("/api/problem-solving", verifyToken, problemSolvingRouter);
  app.use("/api/skills", verifyToken, skillRouter);
  app.use("/api/progression", verifyToken, progressionRouter);
  app.use("/api/gamification", verifyToken, gamificationRouter);

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: "Not found",
      code: "NOT_FOUND",
      statusCode: 404,
      path: req.path,
    });
  });

  app.use(errorHandler);

  return app;
}

export const app = createApp();
export default app;
