import { Router, Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler.js";
import { ensureUser } from "../services/gembaService.js";
import { HttpError, ValidationError } from "../middleware/errors.js";
import { skillTreeEngine } from "../services/skillTreeEngine.js";

const router = Router();
const skillIdParamSchema = z.object({
  skillId: z.coerce.number().int().positive(),
});

router.get(
  "/tree",
  asyncHandler(async (req: Request, res: Response) => {
    const user = await ensureUser(req.user);
    const skills = skillTreeEngine.getSkillTreeForUser({ id: user.id, totalXp: user.totalXp });
    res.json(skills);
  })
);

router.get(
  "/my-skills",
  asyncHandler(async (req: Request, res: Response) => {
    const user = await ensureUser(req.user);
    const payload = skillTreeEngine.getUserSkills({ id: user.id, totalXp: user.totalXp });
    res.json(payload);
  })
);

router.patch(
  "/:skillId/activate",
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = skillIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new ValidationError("Invalid skill ID", parsed.error.flatten());
    }

    const user = await ensureUser(req.user);
    const updated = skillTreeEngine.activateSkill(user.id, parsed.data.skillId);
    res.json(updated);
  })
);

router.post(
  "/:skillId/deactivate",
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = skillIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new ValidationError("Invalid skill ID", parsed.error.flatten());
    }

    const user = await ensureUser(req.user);
    const updated = skillTreeEngine.deactivateSkill(user.id, parsed.data.skillId);
    res.json(updated);
  })
);

router.get(
  "/unlock-status",
  asyncHandler(async (req: Request, res: Response) => {
    const user = await ensureUser(req.user);
    const status = skillTreeEngine.getUnlockStatus({ id: user.id, totalXp: user.totalXp });
    res.json(status);
  })
);

router.post(
  "/gain-xp",
  asyncHandler(async (req: Request, res: Response) => {
    const schema = z.object({ xpAmount: z.number().int().nonnegative() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid XP payload", parsed.error.flatten());
    }

    const user = await ensureUser(req.user);
    const progression = skillTreeEngine.addXp({ id: user.id, totalXp: user.totalXp }, parsed.data.xpAmount);
    res.json(progression);
  })
);

router.use((err: Error, _req: Request, res: Response, next: Function) => {
  if (err instanceof HttpError) return next(err);
  return next(err);
});

export default router;
