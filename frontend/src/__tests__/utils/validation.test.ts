import { describe, it, expect } from "vitest";

import { validateConfig, validateSlug } from "@/src/utils/validation";
import type { TenantConfig } from "@/src/types/tenant";

const baseConfig: TenantConfig = {
  tenant: {
    id: "1",
    slug: "acme-factory",
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

describe("validation utils", () => {
  it("validates slug format", () => {
    expect(validateSlug("good-slug-123")).toBe(true);
    expect(validateSlug("Invalid!")).toBe(false);
  });

  it("ensures tenant config contains required fields", () => {
    expect(validateConfig(baseConfig)).toBe(true);

    const missingName = { ...baseConfig, tenant: { ...baseConfig.tenant, name: "" } };
    expect(validateConfig(missingName)).toBe(false);
  });
});
