import { VALIDATION_RULES } from "@/src/constants";
import type { TenantConfig } from "@/src/types/tenant";

export function validateSlug(slug: string): boolean {
  return VALIDATION_RULES.tenantSlug.test(slug);
}

export function validateConfig(config: TenantConfig): boolean {
  if (!validateSlug(config.tenant.slug)) return false;
  if (!config.tenant.name || !config.tenant.language || !config.tenant.timezone) {
    return false;
  }
  if (!config.factories || !Array.isArray(config.factories)) return false;
  if (!config.auditTemplates || !Array.isArray(config.auditTemplates)) return false;
  if (!config.lpaTemplates || !Array.isArray(config.lpaTemplates)) return false;
  return true;
}
