/**
 * Data isolation enforcement helpers.
 *
 * Always scope Prisma queries by tenantId to avoid cross-tenant data leaks.
 * Example:
 *   await prisma.user.findMany({ where: { tenantId: req.tenantId } });
 */
import { NextFunction, Request, Response } from "express";
import type { ApiErrorResponse } from "../types/response.js";

export function requireTenantContext(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.tenantId) {
    const body: ApiErrorResponse = {
      success: false,
      error: "Tenant context is required",
      code: "TENANT_SLUG_REQUIRED",
      statusCode: 400,
      hint: "Run tenantContext middleware before protected routes",
    };
    return res.status(body.statusCode).json(body);
  }

  return next();
}
