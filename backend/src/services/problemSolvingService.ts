import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";
import { calculateXpGain, scoreAnalysis } from "./problemSolvingEvaluationService.js";

export async function getChallengesByArea(areaId: number) {
  return prisma.problemSolvingChallenge.findMany({
    where: { areaId, status: "active" },
    orderBy: { difficulty: "desc" },
  });
}

export async function getChallenge(challengeId: number) {
  return prisma.problemSolvingChallenge.findUnique({ where: { id: challengeId } });
}

export async function startAnalysis(
  userId: number,
  challengeId: number,
  payload?: {
    selectedCategories?: Prisma.JsonValue;
    causes?: Prisma.JsonValue;
  }
) {
  return prisma.problemAnalysis.create({
    data: {
      userId,
      challengeId,
      status: "in_progress",
      selectedCategories: payload?.selectedCategories,
      causes: payload?.causes,
    },
  });
}

export async function updateAnalysis(
  analysisId: number,
  data: {
    selectedCategories?: Prisma.JsonValue;
    causes?: Prisma.JsonValue;
    rootCauseId?: number | null;
    rootCause?: string | null;
    proposedSolution?: string | null;
    solutionDetails?: string | null;
    solutionQuality?: string | null;
    timeSpent?: number | null;
  }
) {
  return prisma.problemAnalysis.update({
    where: { id: analysisId },
    data,
  });
}

export async function submitAnalysis(
  analysisId: number,
  userId: number,
  payload: {
    selectedCategories?: Prisma.JsonValue;
    causes?: Prisma.JsonValue;
    rootCauseId?: number | null;
    rootCause?: string | null;
    proposedSolution?: string | null;
    solutionDetails?: string | null;
    solutionQuality?: string | null;
    timeSpent?: number | null;
  }
) {
  const analysis = await prisma.problemAnalysis.update({
    where: { id: analysisId },
    data: {
      ...payload,
      status: "submitted",
      completedAt: new Date(),
    },
  });

  const challenge = await prisma.problemSolvingChallenge.findUnique({
    where: { id: analysis.challengeId },
  });

  if (!challenge) {
    return analysis;
  }

  const scores = scoreAnalysis(analysis, challenge);
  const xpGain = calculateXpGain(challenge, scores.totalScore, payload.timeSpent ?? undefined);

  const updated = await prisma.problemAnalysis.update({
    where: { id: analysisId },
    data: {
      ...scores,
      totalScore: scores.totalScore,
      xpGain,
      pointsGain: scores.totalScore,
      rootCauseCorrect: analysis.rootCauseId === challenge.correctRootCauseId,
      status: "evaluated",
    },
  });

  await prisma.ishikawaHistory.create({
    data: {
      userId,
      analysisId: updated.id,
      diagramJson: {
        selectedCategories: updated.selectedCategories,
        causes: updated.causes,
        rootCauseId: updated.rootCauseId,
      },
    },
  });

  return updated;
}

export async function getAnalysis(analysisId: number) {
  return prisma.problemAnalysis.findUnique({
    where: { id: analysisId },
    include: { challenge: true },
  });
}

export async function getHistory(userId: number) {
  return prisma.problemAnalysis.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function getLeaderboard() {
  const results = await prisma.problemAnalysis.groupBy({
    by: ["userId"],
    _avg: { totalScore: true },
    _count: { _all: true },
    orderBy: { _avg: { totalScore: "desc" } },
    take: 10,
  });

  const userIds = results.map((row) => row.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });

  const usersById = users.reduce<Record<number, string>>((map, user) => {
    map[user.id] = user.name;
    return map;
  }, {});

  return results.map((row) => ({
    userId: row.userId,
    userName: usersById[row.userId] ?? "Unknown",
    averageScore: row._avg.totalScore ?? 0,
    analyses: row._count._all,
  }));
}
