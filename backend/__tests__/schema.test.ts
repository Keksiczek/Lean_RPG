import { PrismaClient } from "@prisma/client";

describe.skip("Prisma Schema", () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should create a Tenant with factories", async () => {
    const tenant = await prisma.tenant.create({
      data: {
        slug: "test-tenant",
        name: "Test Tenant",
        factories: { create: [{ name: "Factory A", defaultChecklist: [], fiveS_SortItems: [], fiveS_SetLocations: [], fiveS_ShineAreas: [] }] },
      },
      include: { factories: true },
    });

    expect(tenant.factories.length).toBe(1);
  });

  it("should enforce unique slug constraint", async () => {
    await prisma.tenant.create({ data: { slug: "unique-slug", name: "T1" } });
    await expect(
      prisma.tenant.create({ data: { slug: "unique-slug", name: "T2" } })
    ).rejects.toBeTruthy();
  });
});
