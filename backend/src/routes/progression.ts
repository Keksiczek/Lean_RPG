import { Request, Response, Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler.js";
import { UnauthorizedError, ValidationError } from "../middleware/errors.js";
import { progressionService } from "../services/progressionService.js";
import { skillTreeService } from "../services/skillTreeService.js";

const router = Router();

const leaderboardQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(100).default(10) });

function parseLeaderboardQuery(query: Request["query"]) {
  try {
    return leaderboardQuerySchema.parse(query);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError("Invalid leaderboard query", { issues: error.issues });
    }
    throw error;
  }
}

router.get(
  "/dashboard",
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const progression = await progressionService.ensureProgression(req.user.userId);
    const dashboard = await skillTreeService.getProgressionDashboard(req.user.userId);
    return res.json({ ...progression, ...dashboard });
  }),
);

router.get(
  "/history",
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const history = await progressionService.getProgressionHistory(req.user.userId, 10);
    return res.json(history);
  }),
);

router.get(
  "/leaderboard",
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const { limit } = parseLeaderboardQuery(req.query);
    const leaderboard = await progressionService.getProgressionLeaderboard(limit);
    return res.json(leaderboard);
  }),
);

export default router;
