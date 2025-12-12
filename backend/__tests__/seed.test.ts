import { PrismaClient } from "@prisma/client";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { seedMagnaTenant } from "../prisma/seed";

const prisma = new PrismaClient();

describe("Seed Data - Magna Nymburk", () => {
  beforeAll(async () => {
    await seedMagnaTenant();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should create tenant with 5 factories", async () => {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: "magna-nymburk" },
      include: { factories: true },
    });
    expect(tenant?.factories.length).toBe(5);
  });

  it("should create 40+ total workshops", async () => {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: "magna-nymburk" },
      include: { factories: { include: { workshops: true } } },
    });
    const total = tenant?.factories.reduce((sum, f) => sum + f.workshops.length, 0) ?? 0;
    expect(total).toBeGreaterThanOrEqual(40);
  });

  it("should create 5x 5S audit templates", async () => {
    const audits = await prisma.auditTemplate.findMany({
      where: { tenant: { slug: "magna-nymburk" }, category: "5S" },
    });
    expect(audits.length).toBe(5);
  });

  it("should create 4+ LPA templates", async () => {
    const lpas = await prisma.lPATemplate.findMany({
      where: { tenant: { slug: "magna-nymburk" } },
    });
    expect(lpas.length).toBeGreaterThanOrEqual(4);
  });

  it("should have correct tenant metadata", async () => {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: "magna-nymburk" },
    });
    expect(tenant?.language).toBe("cs");
    expect(tenant?.locale).toBe("cs-CZ");
    expect(tenant?.timezone).toBe("Europe/Prague");
  });
});
