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
import { errorHandler, HttpError } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/logger.js";
import logger from "./lib/logger.js";
import { GeminiService } from "./services/GeminiService.js";
import { registerGeminiProcessor } from "./queue/geminiJobs.js";

const app = express();
const PORT = config.app.port;
const HOST = config.app.host;

app.use(cors({ origin: config.cors.origin }));
app.use(express.json());
if (config.logging.enableHttpLogs) {
  app.use(requestLogger);
}

app.use("/auth", authRoutes);
app.use("/quests", verifyToken, questRoutes);
app.use("/submissions", verifyToken, submissionRoutes);
app.use("/users", verifyToken, userRoutes);
app.use("/areas", verifyToken, areaRoutes);
app.use(healthRouter);

const geminiService = new GeminiService();
registerGeminiProcessor(geminiService);

app.use((req, _res, next) => {
  next(new HttpError(`Route not found: ${req.originalUrl}`, 404));
});

app.use(errorHandler);

app.listen(PORT, HOST, () => {
  logger.info({
    message: "server_started",
    port: PORT,
    host: HOST,
    environment: config.env,
  });
});
