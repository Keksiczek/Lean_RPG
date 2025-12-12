import { render, waitFor, screen, act } from "@testing-library/react";
import { useContext } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { TenantProvider } from "@/src/contexts/TenantProvider";
import { TenantContext } from "@/src/contexts/TenantContext";
import { clearCachedConfig, setCachedConfig } from "@/src/lib/cache";
import type { TenantConfig } from "@/src/types/tenant";
import { fetchTenantConfig } from "@/src/lib/tenantApi";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/tenant/acme/dashboard"),
}));

vi.mock("@/src/lib/tenantApi", () => ({
  fetchTenantConfig: vi.fn(),
}));

const mockConfig: TenantConfig = {
  tenant: {
    id: "1",
    slug: "acme",
    name: "ACME",
    language: "en",
    timezone: "UTC",
    primaryColor: "#000000",
    secondaryColor: "#ffffff",
    leanMethodologies: ["5S"],
  },
  factories: [],
  auditTemplates: [],
  lpaTemplates: [],
};

function ContextConsumer() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("TenantContext missing");
  return (
    <div>
      <span data-testid="slug">{ctx.tenantSlug ?? "none"}</span>
      <span data-testid="loading">{ctx.isLoading ? "loading" : "idle"}</span>
      <span data-testid="config">{ctx.config?.tenant.slug ?? "null"}</span>
      <span data-testid="error">{ctx.error?.message ?? ""}</span>
      <span data-testid="language">{ctx.language}</span>
      <button onClick={() => ctx.setLanguage("cs")}>set-lang</button>
      <button onClick={() => ctx.refreshConfig()}>refresh</button>
    </div>
  );
}

describe("TenantProvider", () => {
  const mockFetch = fetchTenantConfig as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
    localStorage.clear();
    mockFetch.mockResolvedValue(mockConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("provides initial null config and loading state", () => {
    render(
      <TenantProvider initialSlug="acme">
        <ContextConsumer />
      </TenantProvider>
    );

    expect(screen.getByTestId("config").textContent).toBe("null");
    expect(screen.getByTestId("loading").textContent).toBe("loading");
    expect(screen.getByTestId("error").textContent).toBe("");
  });

  it("loads tenant config from API when cache is empty", async () => {
    render(
      <TenantProvider initialSlug="acme">
        <ContextConsumer />
      </TenantProvider>
    );

    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith("acme"));
    expect(screen.getByTestId("config").textContent).toBe("acme");
    expect(screen.getByTestId("loading").textContent).toBe("idle");
    expect(screen.getByTestId("language").textContent).toBe("en");
  });

  it("uses cached config when available", async () => {
    setCachedConfig("acme", mockConfig);

    render(
      <TenantProvider initialSlug="acme">
        <ContextConsumer />
      </TenantProvider>
    );

    await waitFor(() => expect(screen.getByTestId("config").textContent).toBe("acme"));
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("refreshConfig invalidates cache and fetches again", async () => {
    setCachedConfig("acme", mockConfig);
    const refreshedConfig = { ...mockConfig, tenant: { ...mockConfig.tenant, name: "Refreshed" } };
    mockFetch.mockResolvedValueOnce(refreshedConfig);

    render(
      <TenantProvider initialSlug="acme">
        <ContextConsumer />
      </TenantProvider>
    );

    await waitFor(() => expect(screen.getByTestId("config").textContent).toBe("acme"));

    const refreshButton = screen.getByText("refresh");
    await act(async () => refreshButton.click());

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("config").textContent).toBe("acme");
    expect(clearCachedConfig("acme")).toBeUndefined();
  });

  it("handles invalid slug errors gracefully", async () => {
    render(
      <TenantProvider initialSlug="INVALID!">
        <ContextConsumer />
      </TenantProvider>
    );

    await waitFor(() => expect(screen.getByTestId("error").textContent).toContain("invalid"));
    expect(screen.getByTestId("config").textContent).toBe("null");
  });

  it("persists language changes", async () => {
    render(
      <TenantProvider initialSlug="acme">
        <ContextConsumer />
      </TenantProvider>
    );

    const button = screen.getByText("set-lang");
    button.click();
    expect(localStorage.getItem("tenant:language:acme")).toBe("cs");
  });
});
