import prisma from "../lib/prisma.js";
import { FiveSProblem, FiveSAudit, Area, FiveSSetting } from "@prisma/client";

const severityWeight: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

export function identifyMainIssue(problems: FiveSProblem[]): FiveSProblem | null {
  if (!problems.length) return null;

  const sorted = [...problems].sort((a, b) => {
    const severityDelta = (severityWeight[b.severity] ?? 0) - (severityWeight[a.severity] ?? 0);
    if (severityDelta !== 0) return severityDelta;
    return b.id - a.id;
  });

  return sorted[0];
}

export function generateFeedback(
  audit: FiveSAudit & { setting?: FiveSSetting },
  area: Area,
  problems: FiveSProblem[],
): string {
  const lines: string[] = [];

  if (audit.totalScore !== null && audit.totalScore !== undefined) {
    const status = audit.totalScore >= (audit.setting?.passingScore ?? 70) ? "passed" : "needs improvement";
    lines.push(`Audit for ${area.name} ${status}. Score ${audit.totalScore}/100.`);
  }

  if (problems.length) {
    const topIssue = identifyMainIssue(problems);
    if (topIssue) {
      lines.push(`Top issue: ${topIssue.description} (${topIssue.category}, severity ${topIssue.severity}).`);
    }
    lines.push("Address the listed problems to boost the score next run.");
  } else {
    lines.push("Great job keeping the area clean—no critical problems logged.");
  }

  lines.push("Keep standard work visible and sustain daily 5S checks.");
  return lines.join(" ");
}

export async function awardBadges(userId: number, latestScore: number) {
  const aggregates = await prisma.fiveSAudit.aggregate({
    where: { userId, totalScore: { not: null } },
    _count: { _all: true },
    _avg: { totalScore: true },
  });

  const totalAudits = aggregates._count._all;
  const averageScore = aggregates._avg.totalScore ?? 0;

  if (totalAudits >= 25 && averageScore >= 85) {
    return "5S Master";
  }

  if (totalAudits >= 10 && averageScore >= 75) {
    return "5S Auditor";
  }

  if (latestScore >= 70) {
    return "5S Rookie";
  }

  return null;
}

export async function evaluateAudit(
  audit: FiveSAudit & { problems: FiveSProblem[]; area: Area; setting?: FiveSSetting },
) {
  const mainIssue = identifyMainIssue(audit.problems);
  const feedback = generateFeedback(audit, audit.area, audit.problems);
  const badge = await awardBadges(audit.userId, audit.totalScore ?? 0);

  return {
    feedback,
    mainIssue: mainIssue?.description ?? null,
    badge,
  };
}
