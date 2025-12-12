# Multi-Tenant Architecture

## Data Flow

```
User Request
  ↓
Browser: /tenant/magna-nymburk/dashboard
  ↓
TenantProvider: Extract slug
  ↓
Check localStorage: tenant:config:magna-nymburk
  ├─ HIT (< 5min old) → Use cached
  └─ MISS → Fetch from API
      ↓
  API: GET /api/tenants/magna-nymburk/config
      ↓
  tenantContextMiddleware: Validate slug + resolve tenant
      ↓
  Database: SELECT * FROM Tenant WHERE slug = 'magna-nymburk'
      ├─ Include factories { zones, workshops }
      ├─ Include auditTemplates
      └─ Include lpaTemplates
      ↓
  Response: 200 + Cache-Control: max-age=300
      ↓
  Frontend: Cache in localStorage + render components
      ↓
  User sees: FactoryMap + AuditGame + LPAGame (dynamic)
```

## Security Model

### Data Isolation
- Every query scoped by tenantId
- User A cannot see User B data
- Admin endpoints require auth

### Slug Validation
- Format: /^[a-z0-9-]+$/
- No SQL injection possible
- Case-insensitive lookup

### Caching Safety
- localStorage TTL: 5 minutes
- Cache invalidation on refresh
- Fallback to API if corrupted

## Performance

- Config load: < 1s (API)
- Cache HIT: < 100ms (localStorage)
- Redis cache: 5min TTL
- No duplicate API calls
