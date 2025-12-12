import { Router, Request, Response } from "express";
import os from "os";
import { performance } from "perf_hooks";
import prisma from "../lib/prisma.js";
import { getRedis } from "../lib/redis.js";
import logger from "../lib/logger.js";
import { geminiService } from "../services/GeminiService.js";
import { getQueueStats } from "../queue/queueFactory.js";
import type {
  GeminiHealth,
  HealthPayload,
  MemoryUsageMb,
  OverallStatus,
  QueueHealth,
  SubsystemHealth,
} from "../types/health.js";

const router = Router();

const measureLatency = async (fn: () => Promise<void>): Promise<SubsystemHealth> => {
  const start = performance.now();
  try {
    await fn();
    return { status: "connected", latency_ms: performance.now() - start };
  } catch (error) {
    return {
      status: "error",
      latency_ms: performance.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

function getMemoryUsage(): MemoryUsageMb {
  const usage = process.memoryUsage();
  return {
    used_mb: Math.round(usage.heapUsed / 1024 / 1024),
    rss_mb: Math.round(usage.rss / 1024 / 1024),
    heap_mb: Math.round(usage.heapTotal / 1024 / 1024),
  };
}

router.get("/health", async (req: Request, res: Response) => {
  const requestId = (req as Request & { requestId?: string }).requestId;
  const redisClient = getRedis();

  try {
    const [database, redisStatus] = await Promise.all([
      measureLatency(() => prisma.$queryRaw`SELECT 1` as any),
      measureLatency(() => redisClient.ping() as any),
    ]);

    let queue: QueueHealth = {
      status: "stopped",
      pending_jobs: 0,
      completed_jobs: 0,
      failed_jobs: 0,
    };

    try {
      const stats = await getQueueStats();
      queue = {
        status: "running",
        pending_jobs: stats.summary.waiting,
        completed_jobs: stats.summary.completed,
        failed_jobs: stats.summary.failed,
      };
    } catch (error) {
      logger.error("Queue stats failed", { context: "health", error, requestId });
    }

    const geminiCircuit = geminiService.getCircuitBreakerState();
    const gemini: GeminiHealth = {
      circuit_breaker: geminiCircuit.state.toUpperCase(),
      failures: geminiCircuit.failureCount,
      last_failure: geminiCircuit.lastFailure,
    };

    const memory = getMemoryUsage();

    const subsystemStatuses: OverallStatus[] = [
      database.status === "error" ? "unhealthy" : "healthy",
      redisStatus.status === "error" ? "unhealthy" : "healthy",
      gemini.circuit_breaker === "OPEN" ? "degraded" : "healthy",
    ];

    const overallStatus = subsystemStatuses.includes("unhealthy")
      ? "unhealthy"
      : subsystemStatuses.includes("degraded")
        ? "degraded"
        : "healthy";

    const payload: HealthPayload = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      database,
      redis: redisStatus,
      queue,
      gemini,
      memory,
      uptime_seconds: Math.floor(process.uptime()),
      requestId,
      hostname: os.hostname(),
    };

    res.status(overallStatus === "unhealthy" ? 503 : 200).json(payload);
  } catch (error) {
    logger.error("Health check fatal error", { context: "health", error, requestId });
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: { status: "error", latency_ms: 0 },
      redis: { status: "error", latency_ms: 0 },
      queue: { status: "stopped", pending_jobs: 0, completed_jobs: 0, failed_jobs: 0 },
      gemini: { circuit_breaker: "OPEN", failures: 0, last_failure: null },
      memory: getMemoryUsage(),
      uptime_seconds: Math.floor(process.uptime()),
      requestId,
      hostname: os.hostname(),
    });
  }
});

export default router;
