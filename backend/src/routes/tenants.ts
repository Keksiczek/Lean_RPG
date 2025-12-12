import { Router } from "express";
import prisma from "../lib/prisma.js";
import logger from "../lib/logger.js";
import { tenantContext } from "../middleware/tenantContext.js";
import { requireTenantContext } from "../middleware/dataIsolation.js";
import { redisGet, redisSet, redisDel } from "../lib/redis.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { verifyToken, adminCheck } from "../middleware/auth.js";
import type { ApiSuccessResponse } from "../types/response.js";

const router = Router();

const CACHE_TTL_SECONDS = 300;

router.get(
  "/:slug/config",
  tenantContext,
  requireTenantContext,
  asyncHandler(async (req, res) => {
    const slug = req.tenantSlug ?? req.params.slug;
    const cacheKey = `tenant:config:${slug}`;

    const cached = await redisGet(cacheKey);
    if (cached) {
      res.setHeader("Cache-Control", `public, max-age=${CACHE_TTL_SECONDS}`);
      res.setHeader("X-Cache", "HIT");
      const payload = JSON.parse(cached);
      const response: ApiSuccessResponse<typeof payload> = { success: true, data: payload };
      return res.json(response);
    }

    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(500).json({
        success: false,
        error: "Tenant context missing",
        code: "INTERNAL_ERROR",
        statusCode: 500,
      });
    }

    const [factories, auditTemplates, lpaTemplates, tenant] = await Promise.all([
      prisma.factoryConfiguration.findMany({
        where: { tenantId },
        include: { zones: true, workshops: true },
      }),
      prisma.auditTemplate.findMany({ where: { tenantId } }),
      prisma.lPATemplate.findMany({ where: { tenantId } }),
      prisma.tenant.findUnique({ where: { id: tenantId } }),
    ]);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: "Tenant not found",
        code: "TENANT_NOT_FOUND",
        statusCode: 404,
      });
    }

    const payload = {
      tenant,
      factories,
      auditTemplates,
      lpaTemplates,
    };

    await redisSet(cacheKey, JSON.stringify(payload), "EX", CACHE_TTL_SECONDS);

    logger.info({ message: "tenant_config_cached", tenantId, cacheKey });

    res.setHeader("Cache-Control", `public, max-age=${CACHE_TTL_SECONDS}`);
    res.setHeader("X-Cache", "MISS");
    const response: ApiSuccessResponse<typeof payload> = { success: true, data: payload };
    return res.json(response);
  })
);

router.get(
  "/:slug/config/refresh",
  verifyToken,
  adminCheck,
  tenantContext,
  requireTenantContext,
  asyncHandler(async (req, res) => {
    const slug = req.tenantSlug ?? req.params.slug;
    const cacheKey = `tenant:config:${slug}`;

    await redisDel(cacheKey);

    const response: ApiSuccessResponse<{ cacheKey: string }> = {
      success: true,
      data: { cacheKey },
    };

    return res.json(response);
  })
);

export default router;
