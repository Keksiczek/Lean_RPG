# Multi-Tenant Configuration System Plan

This document captures the initial plan to deliver the multi-tenant configuration system described in the latest requirements. It breaks the epic into actionable milestones that align with the requested subtasks and acceptance criteria.

## Milestones

### 1) Data Model & Migrations
- Add `Tenant`, `FactoryConfiguration`, `Zone`, `Workshop`, `AuditTemplate`, and `LPATemplate` models to `schema.prisma`.
- Introduce a `tenantId` foreign key on `User` and add indexes for tenant isolation.
- Generate and test migrations locally.
- Seed two demo tenants (automotive, pharmaceutical) with realistic data.

### 2) Tenant-Aware Backend APIs
- Implement middleware to resolve tenant context from URL path or headers.
- Add `GET /api/tenants/:slug/config` to return tenant config including factories, audits, and LPA templates.
- Add admin CRUD endpoints for tenant and factory management with validation and isolation.
- Ensure all Prisma queries scope by `tenantId`.

### 3) Frontend Tenant Context & Dynamic Rendering
- Add `TenantProvider` + `useTenant` hook to load config on app startup.
- Replace hardcoded workplace/audit constants with data from the tenant config API.
- Add loading/error boundaries and language selection derived from tenant defaults.
- Cache config (e.g., `localStorage`) for quick reloads.

### 4) Testing & Documentation
- Unit and integration tests for tenant service and routes (404, isolation, caching).
- Frontend integration tests to ensure config-driven rendering for different tenants.
- Documentation: API reference, setup guide for new tenants, schema diagram, and example JSON configs.

## Risks & Mitigations
- **Malformed configs** → Add schema validation and error boundaries on the frontend.
- **Stale cache** → Use TTL and manual refresh endpoint.
- **Data leakage** → Enforce tenant scoping and add tests for isolation.
- **Migration safety** → Backups and rollback scripts before applying changes.

## Next Steps
1. Align `schema.prisma` with the new models and run an initial migration.
2. Build seed data that matches the demo configurations (automotive + pharma).
3. Scaffold tenant middleware and the `/api/tenants/:slug/config` endpoint.
4. Implement the frontend context and swap factory/audit consumers to dynamic data.
