import { describe, it, expect, beforeEach, vi } from "vitest";

import { getCachedConfig, setCachedConfig } from "@/src/lib/cache";
import { TENANT_CACHE_TTL } from "@/src/constants";
import type { TenantConfig } from "@/src/types/tenant";

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

describe("tenant cache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    localStorage.clear();
  });

  it("returns null when cache is missing", () => {
    expect(getCachedConfig("acme")).toBeNull();
  });

  it("persists and retrieves cached config within TTL", () => {
    setCachedConfig("acme", config);
    vi.advanceTimersByTime(TENANT_CACHE_TTL - 1);
    expect(getCachedConfig("acme")?.tenant.name).toBe("ACME");
  });

  it("expires cache after TTL", () => {
    setCachedConfig("acme", config);
    vi.advanceTimersByTime(TENANT_CACHE_TTL + 1);
    expect(getCachedConfig("acme")).toBeNull();
  });

  it("handles localStorage errors gracefully", () => {
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = () => {
      throw new Error("quota exceeded");
    };

    expect(() => setCachedConfig("acme", config)).not.toThrow();

    localStorage.setItem = originalSetItem;
  });
});
