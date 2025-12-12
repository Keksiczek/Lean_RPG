import { Router } from "express";
import { z } from "zod";
import prisma from "../../lib/prisma.js";
import { redisDel } from "../../lib/redis.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import type { ApiSuccessResponse, ApiErrorResponse } from "../../types/response.js";

const router = Router();

const tenantCreateSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  language: z.string().optional(),
  timezone: z.string().optional(),
  primaryColor: z.string().optional(),
  description: z.string().optional(),
  locale: z.string().optional(),
  defaultTheme: z.enum(["light", "dark"]).optional(),
  leanMethodologies: z.array(z.string()).optional(),
  secondaryColor: z.string().optional(),
  logoUrl: z.string().optional(),
});

const tenantUpdateSchema = tenantCreateSchema.partial().omit({ slug: true });

function validationError(details: unknown): ApiErrorResponse {
  return {
    success: false,
    error: "Validation error",
    code: "VALIDATION_ERROR",
    statusCode: 400,
    details: details as Record<string, unknown>,
  };
}

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = tenantCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(validationError(parsed.error.format()));
    }

    const payload = parsed.data;
    const existing = await prisma.tenant.findUnique({ where: { slug: payload.slug } });
    if (existing) {
      const body: ApiErrorResponse = {
        success: false,
        error: "Slug already exists",
        code: "SLUG_EXISTS",
        statusCode: 400,
      };
      return res.status(400).json(body);
    }

    const tenant = await prisma.tenant.create({
      data: {
        slug: payload.slug,
        name: payload.name,
        language: payload.language ?? "en",
        timezone: payload.timezone ?? "Europe/Prague",
        primaryColor: payload.primaryColor,
        description: payload.description,
        locale: payload.locale ?? "en-US",
        defaultTheme: payload.defaultTheme ?? "light",
        leanMethodologies: payload.leanMethodologies ?? ["5S", "LPA", "Ishikawa"],
        secondaryColor: payload.secondaryColor,
        logoUrl: payload.logoUrl,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        language: true,
        timezone: true,
        primaryColor: true,
      },
    });

    const response: ApiSuccessResponse<{ tenant: typeof tenant }> = {
      success: true,
      data: { tenant },
    };

    return res.status(201).json(response);
  })
);

router.put(
  "/:slug",
  asyncHandler(async (req, res) => {
    if (req.body?.slug) {
      const body: ApiErrorResponse = {
        success: false,
        error: "Slug cannot be changed",
        code: "INVALID_SLUG",
        statusCode: 400,
      };
      return res.status(400).json(body);
    }

    const parsed = tenantUpdateSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json(validationError(parsed.error.format()));
    }

    const slug = req.params.slug;
    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (!existing) {
      const body: ApiErrorResponse = {
        success: false,
        error: "Tenant not found",
        code: "TENANT_NOT_FOUND",
        statusCode: 404,
      };
      return res.status(404).json(body);
    }

    const updated = await prisma.tenant.update({
      where: { slug },
      data: parsed.data,
      select: {
        id: true,
        slug: true,
        name: true,
        language: true,
        timezone: true,
        primaryColor: true,
      },
    });

    await redisDel(`tenant:config:${slug}`);

    const response: ApiSuccessResponse<{ tenant: typeof updated }> = {
      success: true,
      data: { tenant: updated },
    };

    return res.json(response);
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limitRaw = Number(req.query.limit) || 20;
    const limit = Math.min(Math.max(1, limitRaw), 100);
    const skip = (page - 1) * limit;

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          slug: true,
          name: true,
          language: true,
          timezone: true,
          createdAt: true,
          _count: { select: { factories: true, auditTemplates: true, lpaTemplates: true } },
        },
      }),
      prisma.tenant.count(),
    ]);

    const response: ApiSuccessResponse<{
      tenants: typeof tenants;
      pagination: { page: number; limit: number; total: number; pages: number };
    }> = {
      success: true,
      data: {
        tenants,
        pagination: {
          page,
          limit,
          total,
          pages: Math.max(1, Math.ceil(total / limit)),
        },
      },
    };

    return res.json(response);
  })
);

export default router;
