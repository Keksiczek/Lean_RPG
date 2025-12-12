import { NextFunction, Request, Response } from "express";
import prisma from "../lib/prisma.js";
import logger from "../lib/logger.js";
import type { ApiErrorResponse } from "../types/response.js";

const SLUG_REGEX = /^[a-z0-9-]+$/;

type SlugSource = "params" | "header" | "query";

function extractSlug(req: Request): { slug: string | null; source: SlugSource | null } {
  if (typeof req.params?.slug === "string") {
    return { slug: req.params.slug, source: "params" };
  }

  const headerSlug = req.header("x-tenant-slug");
  if (headerSlug) {
    return { slug: headerSlug, source: "header" };
  }

  const querySlug = typeof req.query.tenant === "string" ? req.query.tenant : null;
  if (querySlug) {
    return { slug: querySlug, source: "query" };
  }

  return { slug: null, source: null };
}

function respondError(res: Response, body: ApiErrorResponse) {
  return res.status(body.statusCode).json(body);
}

export async function tenantContext(req: Request, res: Response, next: NextFunction) {
  const { slug, source } = extractSlug(req);

  if (!slug) {
    return respondError(res, {
      success: false,
      error: "Tenant slug is required",
      code: "TENANT_SLUG_REQUIRED",
      statusCode: 400,
      hint: "Provide slug via URL, X-Tenant-Slug header, or ?tenant query param",
    });
  }

  if (!SLUG_REGEX.test(slug)) {
    return respondError(res, {
      success: false,
      error: "Invalid tenant slug",
      code: "INVALID_SLUG",
      statusCode: 400,
      hint: "Use lowercase letters, numbers, and dashes only",
    });
  }

  try {
    logger.debug({ message: "tenant_slug_extracted", slug, source });

    const tenant = await prisma.$transaction((tx) =>
      tx.tenant.findUnique({ where: { slug } })
    );

    if (!tenant) {
      return respondError(res, {
        success: false,
        error: "Tenant not found",
        code: "TENANT_NOT_FOUND",
        statusCode: 404,
      });
    }

    req.tenantId = tenant.id;
    req.tenantSlug = tenant.slug;
    req.tenant = tenant;

    return next();
  } catch (error) {
    logger.error({
      message: "tenant_resolution_failed",
      slug,
      error: error instanceof Error ? error.message : String(error),
    });

    return respondError(res, {
      success: false,
      error: "Unable to resolve tenant",
      code: "INTERNAL_ERROR",
      statusCode: 500,
    });
  }
}
