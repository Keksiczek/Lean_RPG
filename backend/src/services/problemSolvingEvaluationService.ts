import { ProblemAnalysis, ProblemSolvingChallenge } from "@prisma/client";

const solutionScoreMap: Record<string, number> = {
  poor: 5,
  acceptable: 10,
  good: 15,
  excellent: 20,
};

export function scoreAnalysis(
  analysis: ProblemAnalysis,
  challenge: ProblemSolvingChallenge
) {
  const selectedCategories = Array.isArray(analysis.selectedCategories)
    ? (analysis.selectedCategories as unknown[])
    : [];
  const causes = Array.isArray(analysis.causes) ? (analysis.causes as unknown[]) : [];

  const categoryScore = Math.min(20, selectedCategories.length * 3);
  const causeScore = Math.min(20, causes.length * 2.5);

  const rootCauseScore = analysis.rootCauseId === challenge.correctRootCauseId ? 20 : 10;

  const solutionQualityKey = (analysis.solutionQuality || "acceptable").toLowerCase();
  const solutionScore = solutionScoreMap[solutionQualityKey] ?? solutionScoreMap.acceptable;

  const depthScore = causes
    .filter((cause: any) => cause?.details && String(cause.details).length > 20)
    .length * 4;

  const totalScore = Math.min(100, categoryScore + causeScore + rootCauseScore + solutionScore + depthScore);

  return {
    categoryScore,
    causeScore,
    rootCauseScore,
    solutionScore,
    depthScore,
    totalScore,
  };
}

export function calculateXpGain(
  challenge: ProblemSolvingChallenge,
  totalScore: number,
  timeSpent?: number,
  timeLimitSeconds?: number
) {
  const difficultyBonus: Record<string, number> = {
    easy: 1.0,
    medium: 1.25,
    hard: 1.5,
  };

  const scoreMultiplier = totalScore / 100;
  const difficultyMultiplier = difficultyBonus[challenge.difficulty as keyof typeof difficultyBonus] ?? 1;

  const hasTimeBonus = timeLimitSeconds && timeSpent && timeSpent < timeLimitSeconds * 0.8;
  const timeBonus = hasTimeBonus ? 1.1 : 1;

  const xp = Math.round(challenge.baseXp * scoreMultiplier * difficultyMultiplier * timeBonus);
  return Math.max(xp, 0);
}
