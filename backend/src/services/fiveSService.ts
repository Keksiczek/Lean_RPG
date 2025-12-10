import { FiveSAudit } from "@prisma/client";
import { ValidationError, NotFoundError } from "../middleware/errors.js";
import prisma from "../lib/prisma.js";
import { evaluateAudit } from "./fiveSEvaluationService.js";

export type FiveSAnswer = {
  value: "yes" | "no" | "not_sure";
};

export type FiveSSubmission = {
  sort: FiveSAnswer[];
  order: FiveSAnswer[];
  shine: FiveSAnswer[];
  standardize: FiveSAnswer[];
  sustain: FiveSAnswer[];
};

export type ProblemInput = {
  position: string;
  description: string;
  screenshot?: string;
  category: string;
  severity: "low" | "medium" | "high";
};

export function calculateScore(answers: FiveSSubmission, problems: ProblemInput[]) {
  const categoryScore = (items: FiveSAnswer[]) => items.filter((a) => a.value === "yes").length * 4;

  const scores = {
    sort: categoryScore(answers.sort),
    order: categoryScore(answers.order),
    shine: categoryScore(answers.shine),
    standardize: categoryScore(answers.standardize),
    sustain: categoryScore(answers.sustain),
  };

  const totalScore = Object.values(scores).reduce((sum, value) => sum + value, 0);

  const problemWeight: Record<ProblemInput["severity"], number> = {
    low: 2,
    medium: 5,
    high: 10,
  };

  const problemScore = -1 * problems.reduce((sum, problem) => sum + (problemWeight[problem.severity] ?? 0), 0);
  const finalScore = Math.max(0, totalScore + problemScore);

  return { scores, totalScore: finalScore };
}

export async function startAudit(userId: number, areaId: number) {
  const setting = await prisma.fiveSSetting.findFirst({ where: { areaId } });
  if (!setting) {
    throw new NotFoundError("5S checklist for area");
  }

  const audit = await prisma.fiveSAudit.create({
    data: {
      userId,
      areaId,
      settingId: setting.id,
      status: "in_progress",
      startedAt: new Date(),
    },
    include: { setting: true },
  });

  return audit;
}

export async function submitAudit(
  auditId: number,
  userId: number,
  answers: FiveSSubmission,
  problems: ProblemInput[] = [],
  timeSpent?: number
) {
  const audit = await prisma.fiveSAudit.findUnique({
    where: { id: auditId },
    include: { setting: true, area: true, problems: true },
  });

  if (!audit) {
    throw new NotFoundError("Audit");
  }

  if (audit.userId !== userId) {
    throw new ValidationError("You can only submit your own audits");
  }

  const { scores, totalScore } = calculateScore(answers, problems);
  const status = totalScore >= (audit.setting.passingScore ?? 70) ? "evaluated" : "needs_improvement";

  const difficultyBonus: Record<string, number> = {
    Injection: 1.0,
    Assembly: 1.1,
    Painting: 1.2,
    Warehouse: 1.3,
  };

  const difficultyKey = audit.area.name.split(" ")[0] as keyof typeof difficultyBonus;
  const xpMultiplier =
    (totalScore / 100) * (difficultyBonus[difficultyKey] ?? 1) * (timeSpent && timeSpent < audit.setting.timeLimit ? 1.1 : 1);
  const xpGain = Math.round(100 * xpMultiplier);
  const pointsGain = totalScore;

  const updatedAudit = await prisma.fiveSAudit.update({
    where: { id: auditId },
    data: {
      sortScore: scores.sort,
      orderScore: scores.order,
      shineScore: scores.shine,
      standardizeScore: scores.standardize,
      sustainScore: scores.sustain,
      totalScore,
      problemsFound: problems,
      status,
      completedAt: new Date(),
      timeSpent,
      xpGain,
      pointsGain,
    },
    include: { setting: true, area: true, problems: true },
  });

  if (problems.length) {
    const preparedProblems = problems.map((problem) => ({ ...problem, auditId }));
    await prisma.fiveSProblem.createMany({ data: preparedProblems });
  }

  await prisma.user.update({ where: { id: userId }, data: { totalXp: { increment: xpGain } } });

  const evaluated = await prisma.fiveSAudit.findUnique({
    where: { id: auditId },
    include: { problems: true, area: true, setting: true },
  });

  if (!evaluated) {
    throw new NotFoundError("Audit");
  }

  const feedback = await evaluateAudit(evaluated);

  const finalAudit = await prisma.fiveSAudit.update({
    where: { id: auditId },
    data: {
      aiFeedback: feedback.feedback,
      mainIssue: feedback.mainIssue ?? undefined,
      badgeEarned: feedback.badge ?? undefined,
    },
    include: { problems: true, area: true, setting: true },
  });

  return finalAudit;
}

export async function getAuditDetail(auditId: number, userId: number): Promise<FiveSAudit | null> {
  const audit = await prisma.fiveSAudit.findUnique({
    where: { id: auditId },
    include: { setting: true, problems: true, area: true },
  });

  if (audit && audit.userId !== userId) {
    throw new ValidationError("You can only view your own audits");
  }

  return audit;
}

export async function getAuditHistory(userId: number) {
  return prisma.fiveSAudit.findMany({
    where: { userId },
    include: { area: true, setting: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function addProblem(auditId: number, userId: number, problem: ProblemInput) {
  const audit = await prisma.fiveSAudit.findUnique({ where: { id: auditId } });
  if (!audit) {
    throw new NotFoundError("Audit");
  }

  if (audit.userId !== userId) {
    throw new ValidationError("Cannot update another user's audit");
  }

  const saved = await prisma.fiveSProblem.create({ data: { ...problem, auditId } });
  return saved;
}
