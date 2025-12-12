# Deployment Guide

## Pre-Deployment Checklist

- [ ] All tests passing (90%+ coverage)
- [ ] PR review completed
- [ ] No console errors/warnings
- [ ] API endpoints tested
- [ ] Tenant isolation verified
- [ ] Cache working correctly
- [ ] Backup production DB

## Staging Deployment

1. Deploy backend (API + middleware)
2. Run migrations: `npx prisma migrate deploy`
3. Test endpoints: `npm run test:api`
4. Deploy frontend
5. Test multi-tenant flow

## Production Deployment

1. Backup production database
2. Deploy backend (blue-green if possible)
3. Run migrations
4. Deploy frontend
5. Monitor error rates
6. Verify all tenants loading

## Rollback Procedure

If issues:
```bash
# Restore previous migration
npx prisma migrate resolve --rolled-back multi_tenant_init

# Revert frontend to previous version
git revert <commit-sha>

# Monitor logs
tail -f logs/app.log
```

## Feature Flags

For gradual rollout:
```typescript
const FEATURE_MULTI_TENANT = process.env.FEATURE_MULTI_TENANT === 'true';

if (FEATURE_MULTI_TENANT) {
  // New multi-tenant flow
} else {
  // Legacy single-tenant flow
}
```
