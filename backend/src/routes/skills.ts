import { Request, Response, Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler.js";
import { UnauthorizedError, ValidationError } from "../middleware/errors.js";
import { validateParams } from "../middleware/validation.js";
import { skillTreeService } from "../services/skillTreeService.js";
import { skillUnlockService } from "../services/skillUnlockService.js";
import { progressionService } from "../services/progressionService.js";
import { validateParams } from "../middleware/validation.js";

const router = Router();

const skillIdParamSchema = z.object({ skillId: z.coerce.number().int().positive() });

function parseSkillId(params: Request["params"]) {
  try {
    return skillIdParamSchema.parse(params).skillId;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError("Invalid skill id", { issues: error.issues });
    }
    throw error;
  }
}

router.get(
  "/tree",
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const skills = await skillTreeService.getSkillTree(req.user.userId);
    return res.json(skills);
  }),
);

router.get(
  "/my-skills",
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const progression = await progressionService.ensureProgression(req.user.userId);
    const skills = await skillTreeService.getUserSkills(req.user.userId);

    return res.json({ progression, skills });
  }),
);

router.patch(
  "/:skillId/activate",
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const skillId = parseSkillId(req.params);
    const updated = await skillTreeService.activateSkill(req.user.userId, skillId);
    return res.json(updated);
  }),
);

router.post(
  "/:skillId/deactivate",
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const skillId = parseSkillId(req.params);
    const updated = await skillTreeService.deactivateSkill(req.user.userId, skillId);
    return res.json(updated);
  }),
);

router.get(
  "/unlock-status",
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const status = await skillUnlockService.getUnlockStatus(req.user.userId);
    return res.json(status);
  }),
);

router.get(
  "/:skillId/conditions",
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const skillId = parseSkillId(req.params);
    const result = await skillUnlockService.meetsUnlockConditions(req.user.userId, skillId);
    return res.json(result);
  }),
);

router.post(
  "/:skillId/unlock",
  validateParams(skillIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const { skillId } = req.validated!.params as { skillId: number };
    await skillTreeService.unlockSkill(req.user.userId, skillId);
    const skills = await skillTreeService.getUserSkills(req.user.userId);
    return res.status(201).json(skills);
  }),
);

export default router;
