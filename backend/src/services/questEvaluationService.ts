import { GembaProblem, QuestAnswer } from "./gembaService.js";

export type QuestEvaluationResult = {
  analysisQuality: number;
  rootCauseCorrect: boolean;
  solutionQuality: "inadequate" | "acceptable" | "excellent";
  feedback: string;
  xpReward: number;
  conceptMasteryGain: number;
  bonusUnlock?: string;
};

const difficultyBonus: Record<string, number> = {
  easy: 1,
  medium: 1.25,
  hard: 1.5,
};

function calculateAnalysisQuality(payload: QuestAnswer) {
  const answers = [payload.why1, payload.why2, payload.why3, payload.why4, payload.why5];
  const filled = answers.filter((answer) => answer && answer.trim().length > 3).length;
  return Math.round((filled / 5) * 100);
}

function determineSolutionQuality(problem: GembaProblem, solutionId: number) {
  const solution = problem.solutions.find((item) => item.id === solutionId);
  if (!solution) {
    return "inadequate" as const;
  }

  if (solution.recommended) {
    return "excellent" as const;
  }

  if (solution.feasibility === "high") {
    return "acceptable" as const;
  }

  return "inadequate" as const;
}

export function evaluateQuestAnswer(problem: GembaProblem, payload: QuestAnswer): QuestEvaluationResult {
  const analysisQuality = calculateAnalysisQuality(payload);
  const rootCauseCorrect = problem.rootCause.toLowerCase() === payload.rootCause.toLowerCase();
  const solutionQuality = determineSolutionQuality(problem, payload.solutionId);

  const baseXp = problem.baseXp;
  const qualityMultiplier = analysisQuality / 100;
  const difficultyMultiplier = difficultyBonus[problem.difficulty] ?? 1;
  const speedBonus = 1.0; // Speed bonus not tracked in MVP

  const xp = Math.max(
    10,
    Math.min(Math.round(baseXp * qualityMultiplier * difficultyMultiplier * speedBonus), baseXp * 2)
  );

  const conceptMasteryGain = Math.max(1, Math.round((analysisQuality / 100) * 5));

  const feedback = `Analysis ${analysisQuality}% complete. Root cause ${
    rootCauseCorrect ? "matches" : "differs from"
  } expected focus. Solution ${solutionQuality}.`;

  return {
    analysisQuality,
    rootCauseCorrect,
    solutionQuality,
    feedback,
    xpReward: xp,
    conceptMasteryGain,
    bonusUnlock: rootCauseCorrect && solutionQuality === "excellent" ? "assembly_optimization" : undefined,
  };
}
