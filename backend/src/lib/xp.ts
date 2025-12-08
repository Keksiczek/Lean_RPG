import { Gemini5SScore } from "./geminiTypes.js";

export interface LevelInfo {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  xpToNextLevel: number;
}

function requiredXpForLevel(level: number): number {
  return 100 * level * level;
}

export function calculateLevel(totalXp: number): LevelInfo {
  const sanitizedXp = Math.max(0, totalXp);
  let level = 1;

  while (requiredXpForLevel(level + 1) <= sanitizedXp) {
    level += 1;
  }

  const currentLevelXp = requiredXpForLevel(level);
  const nextLevelXp = requiredXpForLevel(level + 1);

  return {
    level,
    currentLevelXp,
    nextLevelXp,
    xpToNextLevel: Math.max(0, nextLevelXp - sanitizedXp),
  };
}

export function calculateXpGainForSubmission(params: {
  baseXp: number;
  score5s: Gemini5SScore | null;
  riskLevel: "low" | "medium" | "high" | null;
}): number {
  const baseXp = Math.max(0, params.baseXp);
  let xp = baseXp;

  if (params.score5s) {
    const scores = Object.values(params.score5s);
    const avg = scores.reduce((sum, value) => sum + value, 0) / scores.length;

    if (avg >= 80) {
      xp *= 1.5;
    } else if (avg < 50) {
      xp *= 0.8;
    }
  }

  if (params.riskLevel === "high") {
    xp *= 1.3;
  } else if (params.riskLevel === "medium") {
    xp *= 1.1;
  }

  const rounded = Math.max(1, Math.round(xp));
  return rounded;
}
