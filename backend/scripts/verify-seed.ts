import assert from "assert";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifySeedData() {
  const skoda = await prisma.tenant.findUnique({
    where: { slug: "skoda-mlada-boleslav" },
    include: {
      factories: { include: { zones: true, workshops: true, auditTemplates: true } },
      auditTemplates: true,
      lpaTemplates: true,
    },
  });

  assert(skoda, "Skoda tenant should exist");
  assert(skoda.language === "cs", "Language should be Czech");
  const skodaFactories = skoda.factories || [];
  const totalZones = skodaFactories.reduce((sum, factory) => sum + factory.zones.length, 0);
  const totalWorkshops = skodaFactories.reduce((sum, factory) => sum + factory.workshops.length, 0);

  console.log("✅ Skoda tenant loaded");
  console.log(`   - Factories: ${skodaFactories.length}`);
  console.log(`   - Total zones: ${totalZones}`);
  console.log(`   - Total workshops: ${totalWorkshops}`);
  console.log(`   - Audit templates: ${skoda.auditTemplates.length}`);
  console.log(`   - LPA templates: ${skoda.lpaTemplates.length}`);

  assert(skodaFactories.length >= 2, "Skoda should have at least two factories");
  assert(totalZones >= 3, "Skoda should have at least three zones");
  assert(totalWorkshops >= 5, "Skoda should have at least five workshops");

  const pharma = await prisma.tenant.findUnique({
    where: { slug: "novartis-pharma" },
    include: {
      factories: { include: { zones: true, workshops: true } },
      lpaTemplates: true,
    },
  });

  assert(pharma, "Novartis tenant should exist");
  assert(pharma.language === "en", "Pharma tenant should be English");
  console.log("✅ Pharma tenant loaded");
  console.log(`   - Factories: ${pharma?.factories.length ?? 0}`);
  console.log(`   - Zones: ${pharma?.factories[0]?.zones.length ?? 0}`);
  console.log(`   - LPA templates: ${pharma?.lpaTemplates.length ?? 0}`);

  assert(pharma?.factories.length === 1, "Pharma should have one factory");
  assert((pharma?.lpaTemplates.length ?? 0) >= 1, "Pharma should have at least one LPA template");

  console.log("✅ All seed data verified");
}

verifySeedData()
  .catch((error) => {
    console.error("❌ Seed verification failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
