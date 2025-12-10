import { Router, Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { ensureUser } from "../services/gembaService.js";
import { skillTreeEngine } from "../services/skillTreeEngine.js";

const router = Router();

router.get(
  "/dashboard",
  asyncHandler(async (req: Request, res: Response) => {
    const user = await ensureUser(req.user);
    const dashboard = skillTreeEngine.getProgressionDashboard({ id: user.id, totalXp: user.totalXp });
    res.json(dashboard);
  })
);

export default router;
