import { PrismaClient } from "@prisma/client";

describe.skip("Seed Data", () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should create automotive tenant with complete hierarchy", async () => {
    const skoda = await prisma.tenant.findUnique({
      where: { slug: "skoda-mlada-boleslav" },
      include: { factories: { include: { zones: true, workshops: true } } },
    });
    expect(skoda).toBeDefined();
    expect(skoda?.factories.length ?? 0).toBeGreaterThanOrEqual(2);
    const zones = skoda?.factories.reduce((sum, f) => sum + f.zones.length, 0) ?? 0;
    expect(zones).toBeGreaterThan(0);
  });

  it("should create pharmaceutical tenant with GMP templates", async () => {
    const pharma = await prisma.tenant.findUnique({
      where: { slug: "novartis-pharma" },
      include: { lpaTemplates: true },
    });
    expect((pharma?.lpaTemplates.length ?? 0)).toBeGreaterThan(0);
    expect(pharma?.lpaTemplates[0]?.title ?? "").toContain("GMP");
  });
});
