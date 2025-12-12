import http from "http";
import type { AddressInfo } from "net";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const redisStore = new Map<string, string>();
const redisClient = {
  status: "ready",
  get: vi.fn(async (key: string) => redisStore.get(key) ?? null),
  set: vi.fn(async (key: string, value: string) => {
    redisStore.set(key, value);
    return "OK";
  }),
  del: vi.fn(async (key: string) => {
    redisStore.delete(key);
    return 1;
  }),
  flushall: vi.fn(async () => {
    redisStore.clear();
    return "OK";
  }),
  ping: vi.fn(async () => "PONG"),
};

vi.mock("../../src/lib/redis.js", () => ({
  getRedis: vi.fn(() => redisClient as any),
  closeRedis: vi.fn(async () => undefined),
  redisGet: async (key: string) => redisClient.get(key),
  redisSet: async (key: string, value: string) => redisClient.set(key, value),
  redisDel: async (key: string) => redisClient.del(key),
  redisFlushAll: async () => redisClient.flushall(),
}));

const tenants = new Map<string, any>();
const factories = new Map<string, any[]>();
const audits = new Map<string, any[]>();
const lpas = new Map<string, any[]>();

function seedTenant(slug: string, id: string) {
  const now = new Date();
  const tenant = {
    id,
    slug,
    name: slug,
    language: "en",
    timezone: "Europe/Prague",
    primaryColor: "#111111",
    createdAt: now,
  };
  tenants.set(slug, tenant);
  factories.set(id, []);
  audits.set(id, []);
  lpas.set(id, []);
  return tenant;
}

const prismaMock = {
  tenant: {
    findUnique: vi.fn(async ({ where }: any) => {
      if (where.slug) return tenants.get(where.slug) ?? null;
      if (where.id) return Array.from(tenants.values()).find((t) => t.id === where.id) ?? null;
      return null;
    }),
    create: vi.fn(async ({ data }: any) => {
      const tenant = { ...data, id: `t-${tenants.size + 1}`, createdAt: new Date() };
      tenants.set(tenant.slug, tenant);
      factories.set(tenant.id, []);
      audits.set(tenant.id, []);
      lpas.set(tenant.id, []);
      return tenant;
    }),
    update: vi.fn(async ({ where, data }: any) => {
      const existing = tenants.get(where.slug);
      if (!existing) throw new Error("not found");
      const updated = { ...existing, ...data };
      tenants.set(where.slug, updated);
      return updated;
    }),
    findMany: vi.fn(async ({ skip = 0, take = 20 }: any) =>
      Array.from(tenants.values())
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(skip, skip + take)
        .map((tenant) => ({
          ...tenant,
          _count: {
            factories: factories.get(tenant.id)?.length ?? 0,
            auditTemplates: audits.get(tenant.id)?.length ?? 0,
            lpaTemplates: lpas.get(tenant.id)?.length ?? 0,
          },
        }))
    ),
    count: vi.fn(async () => tenants.size),
  },
  factoryConfiguration: {
    findMany: vi.fn(async ({ where }: any) => factories.get(where.tenantId) ?? []),
  },
  auditTemplate: {
    findMany: vi.fn(async ({ where }: any) => audits.get(where.tenantId) ?? []),
  },
  lPATemplate: {
    findMany: vi.fn(async ({ where }: any) => lpas.get(where.tenantId) ?? []),
  },
  $transaction: vi.fn(async (fn: any) => fn(prismaMock)),
};

vi.mock("../../src/lib/prisma.js", () => ({ default: prismaMock }));

vi.mock("../../src/middleware/rateLimiter.js", () => ({
  globalRateLimiter: (_req: any, _res: any, next: any) => next(),
  submissionRateLimiter: (_req: any, _res: any, next: any) => next(),
  authRateLimiter: (_req: any, _res: any, next: any) => next(),
}));

vi.mock("../../src/middleware/auth.js", () => ({
  verifyToken: (req: any, _res: any, next: any) => {
    req.user = { userId: 1, role: "admin" };
    next();
  },
  adminCheck: (_req: any, _res: any, next: any) => next(),
}));

let server: http.Server;
let baseUrl: string;

async function startServer() {
  process.env.DATABASE_URL = process.env.DATABASE_URL ?? "file:./test.db";
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? "secret";
  const app = (await import("../../src/app.js")).default;
  server = app.listen(0);
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
}

describe("tenant routes", () => {
  beforeAll(async () => {
    seedTenant("magna-nymburk", "tenant-1");
    seedTenant("acme", "tenant-2");
    factories.set("tenant-1", [
      { id: "f1", tenantId: "tenant-1", name: "Factory 1", zones: [], workshops: [] },
    ]);
    audits.set("tenant-1", [{ id: "a1", tenantId: "tenant-1", title: "Audit" }]);
    lpas.set("tenant-1", [{ id: "l1", tenantId: "tenant-1", title: "LPA" }]);
    await startServer();
  });

  afterAll(async () => {
    server?.close();
  });

  beforeEach(() => {
    redisStore.clear();
    vi.clearAllMocks();
  });

  it("returns config and caches when missing", async () => {
    const response = await fetch(`${baseUrl}/api/tenants/magna-nymburk/config`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("x-cache")).toBe("MISS");
    expect(payload.success).toBe(true);
    expect(payload.data.factories).toHaveLength(1);
    expect(redisStore.has("tenant:config:magna-nymburk")).toBe(true);
  });

  it("returns cached config on subsequent requests", async () => {
    redisStore.set(
      "tenant:config:magna-nymburk",
      JSON.stringify({ cached: true, factories: [] })
    );

    const response = await fetch(`${baseUrl}/api/tenants/magna-nymburk/config`);
    const payload = await response.json();

    expect(response.headers.get("x-cache")).toBe("HIT");
    expect(payload.data.cached).toBe(true);
    expect(prismaMock.factoryConfiguration.findMany).not.toHaveBeenCalled();
  });

  it("allows admin to refresh cache", async () => {
    redisStore.set("tenant:config:magna-nymburk", "stale");

    const response = await fetch(`${baseUrl}/api/tenants/magna-nymburk/config/refresh`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(redisStore.has("tenant:config:magna-nymburk")).toBe(false);
  });

  it("creates tenant with defaults", async () => {
    const response = await fetch(`${baseUrl}/api/admin/tenants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "new-tenant", name: "New Tenant" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.data.tenant.slug).toBe("new-tenant");
    expect(payload.data.tenant.language).toBe("en");
  });

  it("prevents slug mutation on update", async () => {
    const response = await fetch(`${baseUrl}/api/admin/tenants/magna-nymburk`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "changed" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.code).toBe("INVALID_SLUG");
  });

  it("lists tenants with pagination info", async () => {
    const response = await fetch(`${baseUrl}/api/admin/tenants?page=1&limit=2`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.tenants.length).toBeGreaterThan(0);
    expect(payload.data.pagination.total).toBe(tenants.size);
  });
});
