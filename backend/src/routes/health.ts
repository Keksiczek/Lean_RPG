import { Router, Request, Response } from "express";
import os from "os";
import { performance } from "perf_hooks";
import prisma from "../lib/prisma.js";
import redis from "../lib/redis.js";
import logger from "../lib/logger.js";
import { geminiService } from "../services/GeminiService.js";
import { getQueueStats } from "../queue/queueFactory.js";

const router = Router();

type SubsystemStatus = "healthy" | "degraded" | "unhealthy";

interface HealthSubsystem {
  status: "connected" | "error";
  latency_ms: number;
  error?: string;
}

interface QueueHealth {
  status: "running" | "stopped";
  pending_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
}

const measureLatency = async (fn: () => Promise<void>): Promise<{
  status: "connected" | "error";
  latency_ms: number;
  error?: string;
}> => {
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

function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    used_mb: Math.round(usage.heapUsed / 1024 / 1024),
    rss_mb: Math.round(usage.rss / 1024 / 1024),
    heap_mb: Math.round(usage.heapTotal / 1024 / 1024),
  };
  memory: {
    used_mb: number;
    rss_mb: number;
    heap_mb: number;
  };
  uptime_seconds: number;
}

async function checkDatabase() {
  const start = performance.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency_ms = Math.round(performance.now() - start);
    return { status: "connected" as const, latency_ms };
  } catch (error) {
    logger.error("Healthcheck database failed", { context: "health", error });
    return { status: "error" as const, latency_ms: Math.round(performance.now() - start) };
  }
}

async function checkRedis() {
  const start = performance.now();
  try {
    const [database, redisStatus] = await Promise.all([
      measureLatency(() => prisma.$queryRaw`SELECT 1` as any),
      measureLatency(() => redis.ping() as any),
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
      logger.error("Healthcheck queue stats failed", {
        context: "health",
        error,
        requestId,
      });
    }

    const geminiCircuit = geminiService.getCircuitBreakerState();
    const memory = getMemoryUsage();
    const gemini: { circuit_breaker: string; failures: number; last_failure: Date | null } = {
      circuit_breaker: geminiCircuit.state.toUpperCase(),
      failures: geminiCircuit.failureCount,
      last_failure: geminiCircuit.lastFailure,
    };

    const subsystemStatuses: SubsystemStatus[] = [
      database.status === "error" ? "unhealthy" : "healthy",
      redisStatus.status === "error" ? "unhealthy" : "healthy",
      gemini.circuit_breaker === "OPEN" ? "degraded" : "healthy",
    ];

    const overallStatus = subsystemStatuses.includes("unhealthy")
      ? "unhealthy"
      : subsystemStatuses.includes("degraded")
        ? "degraded"
        : "healthy";

    const payload = {
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
    logger.error("Healthcheck fatal error", {
      context: "health",
      error,
      requestId,
    });
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
