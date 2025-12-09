import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import questRoutes from "./routes/quests.js";
import submissionRoutes from "./routes/submissions.js";
import userRoutes from "./routes/users.js";
import areaRoutes from "./routes/areas.js";
import { verifyToken } from "./middleware/auth.js";
import { config } from "./config.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
const PORT = config.PORT;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/quests", verifyToken, questRoutes);
app.use("/submissions", verifyToken, submissionRoutes);
app.use("/users", verifyToken, userRoutes);
app.use("/areas", verifyToken, areaRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
