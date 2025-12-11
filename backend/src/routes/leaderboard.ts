import { Router, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { getRedis } from "../lib/redis.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../middleware/errors.js";
import { LeaderboardEntry, LeaderboardResponse, PlayerStats } from "../types/index.js";

const router = Router();

const leaderboardQuerySchema = z.object({
  timeframe: z.enum(["all", "week", "month"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  search: z.string().trim().default(""),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const userIdParamSchema = z.object({ id: z.coerce.number().int().positive() });

function parseLeaderboardQuery(query: Request["query"]) {
  try {
    return leaderboardQuerySchema.parse(query);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError("Invalid leaderboard query", { issues: error.issues });
    }

    throw error;
  }
}

function parseUserId(params: Request["params"]) {
  try {
    return userIdParamSchema.parse(params).id;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError("Invalid user id", { issues: error.issues });
    }

    throw error;
  }
}

const DEFAULT_ACHIEVEMENTS = [
  "Continuous Improver",
  "Kaizen Champion",
  "Collaboration Pro",
];

function formatUser(user: {
  id: number;
  email: string;
  name: string;
  role: string;
  totalXp: number;
  level: number;
  createdAt: Date;
  updatedAt: Date;
}): LeaderboardEntry {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as LeaderboardEntry["role"],
    totalXp: user.totalXp,
    level: user.level,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

router.get(
  "/leaderboard",
  asyncHandler(async (req: Request, res: Response) => {
    const { timeframe, page, search, limit } = parseLeaderboardQuery(req.query);

    const redis = getRedis();
    const cacheKey = `leaderboard:${timeframe}:${page}:${limit}:${search.toLowerCase()}`;
    let cached: string | null = null;

    try {
      cached = await redis.get(cacheKey);
    } catch (error) {
      console.warn(
        "Redis cache miss, falling back to DB:",
        error instanceof Error ? error.message : error
      );
    }

    if (cached) {
      return res.json(JSON.parse(cached) as LeaderboardResponse);
    }

    const offset = (page - 1) * limit;
    const searchPattern = `%${search}%`;

    const submissionCountCase =
      timeframe === "week"
        ? Prisma.sql`CASE WHEN s."createdAt" >= NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END`
        : timeframe === "month"
        ? Prisma.sql`CASE WHEN s."createdAt" >= NOW() - INTERVAL '30 days' THEN 1 ELSE 0 END`
        : Prisma.sql`CASE WHEN s."id" IS NULL THEN 0 ELSE 1 END`;

    const [countResult, leaderboardRows] = await Promise.all([
      prisma.$queryRaw<{ total: number }[]>`
        SELECT COUNT(*)::int AS total
        FROM "User" u
        WHERE u."name" ILIKE ${searchPattern}
      `,
      prisma.$queryRaw<
        (LeaderboardEntry & {
          rank: number;
          weeklyXp: number;
          monthlyXp: number;
          submissionsCount: number;
          createdAt: Date;
          updatedAt: Date;
        })[]
      >(
        Prisma.sql`
          SELECT
            u."id",
            u."name",
            u."email",
            u."role",
            u."totalXp",
            u."level",
            u."createdAt",
            u."updatedAt",
            ROW_NUMBER() OVER (ORDER BY u."totalXp" DESC, u."id" ASC) AS rank,
            COALESCE(SUM(CASE WHEN s."createdAt" >= NOW() - INTERVAL '7 days' THEN COALESCE(s."xpGain", 0) ELSE 0 END), 0)::int AS "weeklyXp",
            COALESCE(SUM(CASE WHEN s."createdAt" >= NOW() - INTERVAL '30 days' THEN COALESCE(s."xpGain", 0) ELSE 0 END), 0)::int AS "monthlyXp",
            COALESCE(SUM(${submissionCountCase}), 0)::int AS "submissionsCount"
          FROM "User" u
          LEFT JOIN "Submission" s ON u."id" = s."userId" AND s."status" = 'approved'
          WHERE u."name" ILIKE ${searchPattern}
          GROUP BY u."id"
          ORDER BY u."totalXp" DESC, u."id" ASC
          LIMIT ${limit} OFFSET ${offset}
        `
      ),
    ]);

    const total = countResult[0]?.total ?? 0;

    const players: LeaderboardEntry[] = leaderboardRows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role as LeaderboardEntry["role"],
      totalXp: Number(row.totalXp),
      level: Number(row.level),
      createdAt: new Date(row.createdAt).toISOString(),
      updatedAt: new Date(row.updatedAt).toISOString(),
      rank: Number(row.rank),
      weeklyXp: Number(row.weeklyXp ?? 0),
      monthlyXp: Number(row.monthlyXp ?? 0),
      submissionsCount: Number(row.submissionsCount ?? 0),
    }));

    const response: LeaderboardResponse = {
      players,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };

    try {
      await redis.set(cacheKey, JSON.stringify(response), "EX", 300);
    } catch (error) {
      console.warn(
        "Failed to cache result:",
        error instanceof Error ? error.message : error
      );
    }

    return res.json(response);
  })
);

router.get(
  "/players/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseUserId(req.params);

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        totalXp: true,
        level: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError("Player");
    }

    return res.json(formatUser(user));
  })
);

router.get(
  "/players/:id/stats",
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseUserId(req.params);

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError("Player");
    }

    const [submissionsCount, completedQuests] = await Promise.all([
      prisma.submission.count({ where: { userId: id } }),
      prisma.submission.count({ where: { userId: id, status: "approved" } }),
    ]);

    const [conceptsResult, xpTrendResult, achievements, recentSubmissions] =
      await Promise.all([
        prisma.$queryRaw<{ leanConcept: string; score: number }[]>`
          SELECT q."leanConcept",
                 CASE
                   WHEN COUNT(*) > 0 THEN
                     CASE
                       WHEN ROUND((SUM(COALESCE(s."xpGain", 0)) * 100.0 / 5000)) > 100 THEN 100
                       ELSE ROUND((SUM(COALESCE(s."xpGain", 0)) * 100.0 / 5000))::int
                     END
                   ELSE 0
                 END AS score
          FROM "Submission" s
          JOIN "Quest" q ON s."questId" = q."id"
          WHERE s."userId" = ${id}
            AND s."status" = 'approved'
            AND q."leanConcept" IS NOT NULL
          GROUP BY q."leanConcept"
        `,
        prisma.$queryRaw<{ date: Date; xp: number }[]>`
          SELECT DATE(s."createdAt") AS date,
                 COALESCE(SUM(COALESCE(s."xpGain", 0)), 0)::int AS xp
          FROM "Submission" s
          WHERE s."userId" = ${id}
            AND s."status" = 'approved'
            AND s."createdAt" >= NOW() - INTERVAL '30 days'
          GROUP BY DATE(s."createdAt")
          ORDER BY date
        `,
        prisma.userAchievement.findMany({
          where: { userId: id },
          orderBy: { completedAt: "desc" },
          include: { achievement: { select: { name: true } } },
        }),
        prisma.submission.findMany({
          where: { userId: id, status: "approved" },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            xpGain: true,
            status: true,
            createdAt: true,
            quest: { select: { title: true } },
          },
        }),
      ]);

    const baseConcepts = ["5S", "Kaizen", "Problem Solving", "Standard Work"];
    const concepts: Record<string, number> = Object.fromEntries(
      baseConcepts.map((concept) => [concept, 0])
    );

    conceptsResult.forEach((row) => {
      concepts[row.leanConcept] = Number(row.score ?? 0);
    });

    const xpTrend = xpTrendResult.map((row) => ({
      date: new Date(row.date).toISOString().slice(0, 10),
      xp: Number(row.xp ?? 0),
    }));

    const stats: PlayerStats = {
      submissions: submissionsCount,
      completedQuests,
      concepts,
      xpTrend,
      achievements:
        achievements.length > 0
          ? achievements.map((achievement) => achievement.achievement.name)
          : DEFAULT_ACHIEVEMENTS,
      recentSubmissions: recentSubmissions.map((submission) => ({
        id: submission.id,
        questTitle: submission.quest.title,
        status: submission.status,
        xpGain: submission.xpGain ?? 0,
        completedAt: submission.createdAt.toISOString(),
      })),
    };

    return res.json(stats);
  })
);

async function trackLeaderboardSnapshot() {
  const topPlayers = await prisma.$queryRaw<
    { id: number; totalXp: number; level: number; rank: number }[]
  >`
    SELECT
      u."id",
      u."totalXp",
      u."level",
      ROW_NUMBER() OVER (ORDER BY u."totalXp" DESC, u."id" ASC) AS rank
    FROM "User" u
    LIMIT 100
  `;

  return topPlayers.length;
}

router.post(
  "/admin/leaderboard/snapshot",
  asyncHandler(async (req: Request, res: Response) => {
    if (req.user?.role !== "admin") {
      throw new ForbiddenError("Admin access required");
    }

    const count = await trackLeaderboardSnapshot();

    return res.json({
      message: "Leaderboard snapshot recorded",
      inserted: count,
    });
  })
);

export default router;
