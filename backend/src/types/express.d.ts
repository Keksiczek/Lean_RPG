import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    validatedBody?: unknown;
    validatedParams?: unknown;
    validatedQuery?: unknown;
    tenantId?: string;
    tenantSlug?: string;
    tenant?: import("@prisma/client").Tenant;
  }
}
