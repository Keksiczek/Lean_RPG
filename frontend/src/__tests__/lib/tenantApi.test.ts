import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { fetchTenantConfig } from "@/src/lib/tenantApi";
import type { TenantConfig } from "@/src/types/tenant";

declare const global: typeof globalThis & { fetch: typeof fetch };

const config: TenantConfig = {
  tenant: {
    id: "1",
    slug: "acme",
    name: "ACME",
    language: "en",
    timezone: "UTC",
    primaryColor: "#000",
    secondaryColor: "#fff",
    leanMethodologies: [],
  },
  factories: [],
  auditTemplates: [],
  lpaTemplates: [],
};

describe("fetchTenantConfig", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:3000";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns parsed config on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify(config), { status: 200, headers: { "Content-Type": "application/json" } })
    );

    const result = await fetchTenantConfig("acme");
    expect(result.tenant.slug).toBe("acme");
  });

  it("throws helpful error when not found", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(new Response("", { status: 404 }));
    await expect(fetchTenantConfig("missing"))
      .rejects.toThrow("Tenant not found");
  });

  it("throws error on server failure", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(new Response("boom", { status: 500 }));
    await expect(fetchTenantConfig("acme"))
      .rejects.toThrow("Failed to load tenant config (500)");
  });

  it("throws when API base URL missing", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "";
    await expect(fetchTenantConfig("acme")).rejects.toThrow("API_BASE_URL is not configured");
  });

  it("throws on invalid JSON response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("not-json", { status: 200, headers: { "Content-Type": "application/json" } })
    );

    await expect(fetchTenantConfig("acme")).rejects.toThrow("Failed to parse tenant config response");
  });
});
