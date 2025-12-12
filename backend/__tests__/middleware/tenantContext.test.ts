import { describe, expect, vi, beforeEach, it } from "vitest";
import type { Request, Response } from "express";

const prismaMock = vi.hoisted(() => ({
  tenant: { findUnique: vi.fn() },
  $transaction: vi.fn(async (handler: any) =>
    handler({ tenant: { findUnique: prismaMock.tenant.findUnique } })
  ),
}));

vi.mock("../../src/lib/prisma.js", () => ({
  default: prismaMock,
}));

import { tenantContext } from "../../src/middleware/tenantContext.js";

const mockTenant = { id: "tenant-1", slug: "demo-tenant", name: "Demo" } as any;

describe("tenantContext middleware", () => {
  const json = vi.fn();
  const status = vi.fn(() => ({ json } as unknown as Response));

  const next = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.tenant.findUnique.mockImplementation(async ({ where: { slug } }: any) =>
      slug === mockTenant.slug ? mockTenant : null
    );
    prismaMock.$transaction.mockImplementation(async (handler: any) =>
      handler({ tenant: { findUnique: prismaMock.tenant.findUnique } })
    );
  });

  it("resolves slug from params and attaches tenant", async () => {
    const req = { params: { slug: "demo-tenant" } } as unknown as Request;
    const res = { status } as unknown as Response;

    await tenantContext(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.tenantId).toBe(mockTenant.id);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });

  it("resolves slug from header when params missing", async () => {
    const req = {
      params: {},
      header: (name: string) => (name === "x-tenant-slug" ? "demo-tenant" : undefined),
    } as unknown as Request;
    const res = { status } as unknown as Response;

    await tenantContext(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.tenantId).toBe(mockTenant.id);
  });

  it("rejects invalid slug format", async () => {
    const req = { params: { slug: "INVALID" } } as unknown as Request;
    const res = { status } as unknown as Response;

    await tenantContext(req, res, next);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "INVALID_SLUG", success: false })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 404 when tenant missing", async () => {
    const req = { params: { slug: "missing" } } as unknown as Request;
    const res = { status } as unknown as Response;

    await tenantContext(req, res, next);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "TENANT_NOT_FOUND", success: false })
    );
  });
});
