-- Multi-tenant initial schema
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AuditTemplate') THEN
    ALTER TABLE "AuditTemplate" RENAME TO "LegacyAuditTemplate";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AuditItem') THEN
    ALTER TABLE "AuditItem" RENAME TO "LegacyAuditItem";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Audit') THEN
    ALTER TABLE "Audit" RENAME TO "LegacyAudit";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AuditResult') THEN
    ALTER TABLE "AuditResult" RENAME TO "LegacyAuditResult";
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS "Tenant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "locale" TEXT NOT NULL DEFAULT 'en-US',
    "defaultTheme" TEXT NOT NULL DEFAULT 'light',
    "leanMethodologies" TEXT[] NOT NULL DEFAULT ARRAY['5S','LPA','Ishikawa'],
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Prague',
    "maxPlayers" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_slug_key" ON "Tenant"("slug");
CREATE INDEX IF NOT EXISTS "Tenant_slug_idx" ON "Tenant"("slug");

INSERT INTO "Tenant" ("id", "slug", "name")
VALUES ('default-tenant', 'default', 'Default Tenant')
ON CONFLICT ("id") DO NOTHING;

CREATE TABLE IF NOT EXISTS "FactoryConfiguration" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'production',
    "defaultChecklist" TEXT[] NOT NULL,
    "fiveS_SortItems" TEXT[] NOT NULL,
    "fiveS_SetLocations" TEXT[] NOT NULL,
    "fiveS_ShineAreas" TEXT[] NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FactoryConfiguration_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FactoryConfiguration_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "FactoryConfiguration_tenantId_idx" ON "FactoryConfiguration"("tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "FactoryConfiguration_tenantId_name_key" ON "FactoryConfiguration"("tenantId", "name");

CREATE TABLE IF NOT EXISTS "Zone" (
    "id" TEXT NOT NULL,
    "factoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "coordinates" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'optimal',
    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Zone_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "FactoryConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Zone_factoryId_idx" ON "Zone"("factoryId");

CREATE TABLE IF NOT EXISTS "Workshop" (
    "id" TEXT NOT NULL,
    "factoryId" TEXT NOT NULL,
    "zoneId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "redTags" INTEGER NOT NULL DEFAULT 0,
    "activeTraining" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Workshop_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Workshop_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "FactoryConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Workshop_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Workshop_factoryId_idx" ON "Workshop"("factoryId");
CREATE INDEX IF NOT EXISTS "Workshop_zoneId_idx" ON "Workshop"("zoneId");

CREATE TABLE IF NOT EXISTS "AuditTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "factoryId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "items" JSONB[] NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 150,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditTemplate_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AuditTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AuditTemplate_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "FactoryConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AuditTemplate_tenantId_idx" ON "AuditTemplate"("tenantId");
CREATE INDEX IF NOT EXISTS "AuditTemplate_factoryId_idx" ON "AuditTemplate"("factoryId");

CREATE TABLE IF NOT EXISTS "LPATemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "factoryId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "questions" JSONB[] NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LPATemplate_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LPATemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LPATemplate_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "FactoryConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "LPATemplate_tenantId_idx" ON "LPATemplate"("tenantId");
CREATE INDEX IF NOT EXISTS "LPATemplate_factoryId_idx" ON "LPATemplate"("factoryId");

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tenantId" TEXT NOT NULL DEFAULT 'default-tenant';
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "User_tenantId_idx" ON "User"("tenantId");
