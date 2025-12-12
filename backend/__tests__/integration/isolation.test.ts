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

function seedTenant(slug: string, id: string) {
  tenants.set(slug, { id, slug, name: slug, createdAt: new Date(), language: "en", timezone: "UTC" });
  factories.set(id, [{ id: `${id}-f1`, tenantId: id, name: `${slug} factory`, zones: [], workshops: [] }]);
}

const factoryFindMany = vi.fn(async ({ where }: any) => factories.get(where.tenantId) ?? []);
const prismaMock = {
  tenant: {
    findUnique: vi.fn(async ({ where }: any) => {
      if (where.slug) return tenants.get(where.slug) ?? null;
      if (where.id) return Array.from(tenants.values()).find((t) => t.id === where.id) ?? null;
      return null;
    }),
  },
  factoryConfiguration: { findMany: factoryFindMany },
  auditTemplate: { findMany: vi.fn(async () => []) },
  lPATemplate: { findMany: vi.fn(async () => []) },
  $transaction: vi.fn(async (fn: any) => fn(prismaMock)),
};

vi.mock("../../src/lib/prisma.js", () => ({ default: prismaMock }));

vi.mock("../../src/middleware/rateLimiter.js", () => ({
  globalRateLimiter: (_req: any, _res: any, next: any) => next(),
  submissionRateLimiter: (_req: any, _res: any, next: any) => next(),
  authRateLimiter: (_req: any, _res: any, next: any) => next(),
}));

vi.mock("../../src/middleware/auth.js", () => ({
  verifyToken: (_req: any, _res: any, next: any) => next(),
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

describe("data isolation", () => {
  beforeAll(async () => {
    seedTenant("tenant-a", "tenant-a-id");
    seedTenant("tenant-b", "tenant-b-id");
    await startServer();
  });

  afterAll(async () => {
    server?.close();
  });

  beforeEach(() => {
    redisStore.clear();
    vi.clearAllMocks();
  });

  it("scopes factory queries by tenantId", async () => {
    const response = await fetch(`${baseUrl}/api/tenants/tenant-a/config`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(factoryFindMany).toHaveBeenCalledWith({
      where: { tenantId: "tenant-a-id" },
      include: { zones: true, workshops: true },
    });
    expect(payload.data.factories[0].tenantId).toBe("tenant-a-id");
  });
});
