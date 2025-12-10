import prisma from "../lib/prisma.js";

export async function getSetting(areaId: number) {
  const setting = await prisma.fiveSSetting.findFirst({
    where: { areaId },
  });

  return setting;
}

export async function getLeaderboard() {
  const aggregates = await prisma.fiveSAudit.groupBy({
    by: ["userId"],
    _avg: { totalScore: true },
    _count: { _all: true },
  });

  const users = await prisma.user.findMany({
    where: { id: { in: aggregates.map((row) => row.userId) } },
    select: { id: true, name: true, role: true, level: true, totalXp: true },
  });

  return aggregates
    .map((row) => {
      const user = users.find((u) => u.id === row.userId);
      return {
        userId: row.userId,
        name: user?.name ?? `User ${row.userId}`,
        role: user?.role ?? "operator",
        level: user?.level ?? 1,
        xp: user?.totalXp ?? 0,
        auditCount: row._count._all,
        averageScore: Math.round(row._avg.totalScore ?? 0),
      };
    })
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 25);
}

export async function exportAuditReport(auditId: number) {
  const audit = await prisma.fiveSAudit.findUnique({
    where: { id: auditId },
    include: {
      problems: true,
      area: true,
      setting: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!audit) return null;

  return {
    id: audit.id,
    area: audit.area.name,
    auditor: audit.user.name,
    score: audit.totalScore,
    breakdown: {
      sort: audit.sortScore,
      order: audit.orderScore,
      shine: audit.shineScore,
      standardize: audit.standardizeScore,
      sustain: audit.sustainScore,
    },
    problems: audit.problems,
    mainIssue: audit.mainIssue,
    feedback: audit.aiFeedback,
    createdAt: audit.createdAt,
  };
}
