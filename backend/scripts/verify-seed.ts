import assert from "node:assert";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type TenantSummary = {
  factories: number;
  zones: number;
  workshops: number;
  auditTemplates: number;
  lpaTemplates: number;
};

function logHeader(title: string) {
  console.log("\n==============================");
  console.log(title);
  console.log("==============================");
}

function printFactoryBreakdown(summary: TenantSummary) {
  console.log("Factory summary:");
  console.log(` - Factories: ${summary.factories}`);
  console.log(` - Zones: ${summary.zones}`);
  console.log(` - Workstations: ${summary.workshops}`);
}

function printTemplateBreakdown(summary: TenantSummary) {
  console.log("Template summary:");
  console.log(` - Audit templates: ${summary.auditTemplates}`);
  console.log(` - LPA templates: ${summary.lpaTemplates}`);
}

function summarizeTenant(tenant: NonNullable<Awaited<ReturnType<typeof loadTenant>>>) {
  const factories = tenant.factories.length;
  const zones = tenant.factories.reduce((sum, factory) => sum + factory.zones.length, 0);
  const workshops = tenant.factories.reduce((sum, factory) => sum + factory.workshops.length, 0);

  return {
    factories,
    zones,
    workshops,
    auditTemplates: tenant.auditTemplates.length,
    lpaTemplates: tenant.lpaTemplates.length,
  } satisfies TenantSummary;
}

async function loadTenant() {
  return prisma.tenant.findUnique({
    where: { slug: "magna-nymburk" },
    include: {
      factories: { include: { zones: true, workshops: true } },
      auditTemplates: true,
      lpaTemplates: true,
    },
  });
}

function verifyFactories(tenant: NonNullable<Awaited<ReturnType<typeof loadTenant>>>) {
  assert(tenant.factories.length === 5, "✗ Should have 5 factories");
  tenant.factories.forEach((factory) => {
    assert(factory.zones.length >= 2, `✗ ${factory.name} should have at least 2 zones`);
    assert(factory.workshops.length >= factory.zones.length, "✗ Each factory should have workshops mapped to zones");
  });
}

function verifyCounts(summary: TenantSummary) {
  assert(summary.zones >= 20, `✗ Should have 20+ zones, got ${summary.zones}`);
  assert(summary.workshops >= 40, `✗ Should have 40+ workshops, got ${summary.workshops}`);
}

function verifyTemplates(tenant: NonNullable<Awaited<ReturnType<typeof loadTenant>>>) {
  assert(tenant.auditTemplates.length >= 5, "✗ Should have 5+ audit templates");
  const fiveS = tenant.auditTemplates.filter((template) => template.category === "5S");
  assert(fiveS.length === 5, `✗ Should have 5x 5S audits, got ${fiveS.length}`);

  assert(tenant.lpaTemplates.length >= 4, "✗ Should have 4+ LPA templates");

  const totalLpaQuestions = tenant.lpaTemplates.reduce((sum, template) => sum + (template.questions?.length ?? 0), 0);
  assert(totalLpaQuestions >= 15, `✗ Expected 15+ LPA questions, got ${totalLpaQuestions}`);
}

function verifyMetadata(tenant: NonNullable<Awaited<ReturnType<typeof loadTenant>>>) {
  assert(tenant.language === "cs", "✗ Language should be Czech");
  assert(tenant.locale === "cs-CZ", "✗ Locale should be Czech");
  assert(tenant.timezone === "Europe/Prague", "✗ Timezone should be Europe/Prague");
}

async function verifySeedData() {
  logHeader("MAGNA Nymburk Seed Verification");
  const tenant = await loadTenant();
  assert(tenant, "✗ Tenant magna-nymburk should be created");
  console.log("✅ Tenant Magna Nymburk loaded");

  verifyMetadata(tenant);
  verifyFactories(tenant);

  const summary = summarizeTenant(tenant);
  verifyCounts(summary);
  verifyTemplates(tenant);

  logHeader("Verification results");
  printFactoryBreakdown(summary);
  printTemplateBreakdown(summary);

  console.log("✅ All seed data verified!");
  console.log(`   - Language: ${tenant.language}`);
  console.log(`   - Timezone: ${tenant.timezone}`);
}

verifySeedData()
  .catch((error) => {
    console.error("❌ Verification failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
