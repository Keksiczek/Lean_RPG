import { Router, Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler.js";
import {
  ensureUser,
  getAreaDetail,
  getAreasForUser,
  getNpcDialogWithProblem,
  getProblemById,
  getQuestById,
  getQuestStatus,
  startQuest,
  submitQuestAnswer,
  summarizeQuestProgress,
} from "../services/gembaService.js";
import { ValidationError } from "../middleware/errors.js";

const router = Router();

const questSubmissionSchema = z.object({
  why1: z.string().min(2),
  why2: z.string().min(2),
  why3: z.string().min(2),
  why4: z.string().min(2),
  why5: z.string().min(2),
  rootCause: z.string().min(2),
  solutionId: z.number(),
});

router.get(
  "/areas",
  asyncHandler(async (req: Request, res: Response) => {
    const user = await ensureUser(req.user);
    const areas = getAreasForUser(user);
    res.json({ areas });
  })
);

router.get(
  "/areas/:areaId",
  asyncHandler(async (req: Request, res: Response) => {
    const user = await ensureUser(req.user);
    const areaId = Number(req.params.areaId);
    const area = getAreaDetail(areaId, user);
    res.json(area);
  })
);

router.get(
  "/npcs/:npcId",
  asyncHandler(async (req: Request, res: Response) => {
    const npcId = Number(req.params.npcId);
    const npc = getNpcDialogWithProblem(npcId);
    res.json(npc);
  })
);

router.get(
  "/problems/:problemId",
  asyncHandler(async (req: Request, res: Response) => {
    const problemId = Number(req.params.problemId);
    const problem = getProblemById(problemId);
    res.json(problem);
  })
);

router.get(
  "/quests/:questId",
  asyncHandler(async (req: Request, res: Response) => {
    const questId = Number(req.params.questId);
    const quest = getQuestById(questId);
    res.json(quest);
  })
);

router.post(
  "/quests/:questId/start",
  asyncHandler(async (req: Request, res: Response) => {
    const questId = Number(req.params.questId);
    const user = await ensureUser(req.user);
    const state = startQuest(questId, user);
    res.status(201).json({ state });
  })
);

router.post(
  "/quests/:questId/submit",
  asyncHandler(async (req: Request, res: Response) => {
    const questId = Number(req.params.questId);
    const user = await ensureUser(req.user);

    const parsed = questSubmissionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid quest submission", parsed.error.flatten());
    }

    const result = submitQuestAnswer(questId, user, parsed.data);
    res.json(result);
  })
);

router.get(
  "/quests/:questId/status",
  asyncHandler(async (req: Request, res: Response) => {
    const questId = Number(req.params.questId);
    const user = await ensureUser(req.user);
    const state = getQuestStatus(questId, user.id);
    res.json(state);
  })
);

router.get(
  "/progress",
  asyncHandler(async (req: Request, res: Response) => {
    const user = await ensureUser(req.user);
    const progress = summarizeQuestProgress(user.id);
    res.json({ progress });
  })
);

export default router;
