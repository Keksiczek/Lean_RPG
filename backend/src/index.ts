import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import questRoutes from "./routes/quests.js";
import submissionRoutes from "./routes/submissions.js";
import userRoutes from "./routes/users.js";
import areaRoutes from "./routes/areas.js";
import healthRouter from "./routes/health.js";
import { verifyToken } from "./middleware/auth.js";
import { config } from "./config.js";
import { requestLogger } from "./middleware/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import logger from "./lib/logger.js";
import { GeminiService } from "./services/GeminiService.js";
import { registerGeminiProcessor } from "./queue/geminiJobs.js";

const app = express();
const PORT = config.app.port;
const HOST = config.app.host;

if (config.logging.enableHttpLogs) {
  app.use(requestLogger);
}

app.use(cors({ origin: config.cors.origin }));
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/quests", verifyToken, questRoutes);
app.use("/submissions", verifyToken, submissionRoutes);
app.use("/users", verifyToken, userRoutes);
app.use("/areas", verifyToken, areaRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/quests", verifyToken, questRoutes);
app.use("/api/submissions", verifyToken, submissionRoutes);
app.use("/api/users", verifyToken, userRoutes);
app.use("/api/areas", verifyToken, areaRoutes);
app.use(healthRouter);

const geminiService = new GeminiService();
registerGeminiProcessor(geminiService);

app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    code: "NOT_FOUND",
    path: req.path,
  });
});

app.use(errorHandler);

app.listen(PORT, HOST, () => {
  logger.info({
    message: "Server started",
    port: PORT,
    host: HOST,
    environment: config.env,
  });
});

process.on("uncaughtException", (err) => {
  logger.error({
    message: "Uncaught exception",
    error: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error({
    message: "Unhandled rejection",
    error: String(reason),
  });
});
