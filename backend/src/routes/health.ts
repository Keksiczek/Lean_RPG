import { Router, Request, Response } from "express";
import os from "os";
import prisma from "../lib/prisma.js";
import redis from "../lib/redis.js";
import { getGeminiCircuitState } from "../lib/gemini.js";
import logger from "../lib/logger.js";

const router = Router();

type HealthStatus = "ok" | "degraded" | "error";

interface HealthResponse {
  status: HealthStatus;
  timestamp: string;
  requestId?: string;
  details: {
    database: "connected" | "error";
    redis: "connected" | "error";
    memory: {
      used: string;
      rss: string;
    };
    uptime: number;
    gemini_circuit: string;
    hostname: string;
  };
}

router.get("/health", async (req: Request, res: Response) => {
  const requestId = req.requestId;

  try {
    let dbStatus: "connected" | "error" = "connected";
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      dbStatus = "error";
      logger.error("Healthcheck database failed", {
        context: "health",
        error,
        requestId,
      });
    }

    let redisStatus: "connected" | "error" = "connected";
    try {
      await redis.ping();
    } catch (error) {
      redisStatus = "error";
      logger.error("Healthcheck redis failed", {
        context: "health",
        error,
        requestId,
      });
    }

    const memUsage = process.memoryUsage();
    const memUsed = Math.round(memUsage.heapUsed / 1024 / 1024);
    const memRss = Math.round(memUsage.rss / 1024 / 1024);

    const circuitState = getGeminiCircuitState();

    let status: HealthStatus = "ok";
    if (dbStatus === "error" && redisStatus === "error") {
      status = "error";
    } else if (dbStatus === "error" || redisStatus === "error" || circuitState === "OPEN") {
      status = "degraded";
    }

    const payload: HealthResponse = {
      status,
      timestamp: new Date().toISOString(),
      requestId,
      details: {
        database: dbStatus,
        redis: redisStatus,
        memory: {
          used: `${memUsed}MB`,
          rss: `${memRss}MB`,
        },
        uptime: Math.floor(process.uptime()),
        gemini_circuit: circuitState,
        hostname: os.hostname(),
      },
    };

    logger.info("Healthcheck executed", {
      context: "health",
      requestId,
      status,
    });

    res.status(status === "error" ? 503 : 200).json(payload);
  } catch (error) {
    logger.error("Healthcheck fatal error", {
      context: "health",
      error,
      requestId,
    });
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      requestId,
      details: {
        database: "error",
        redis: "error",
        memory: { used: "unknown", rss: "unknown" },
        uptime: Math.floor(process.uptime()),
        gemini_circuit: "unknown",
        hostname: os.hostname(),
      },
    });
  }
});

export default router;
