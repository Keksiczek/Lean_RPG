# QA Checklist

## Functional Testing
- [ ] One codebase supports 3+ tenants
- [ ] URL /tenant/:slug/dashboard loads config automatically
- [ ] Config from /api/tenants/:slug/config correct
- [ ] FactoryMap renders factories from config
- [ ] AuditGame renders audits from config
- [ ] LPAGame renders LPA from config
- [ ] localStorage caching (5min TTL)
- [ ] Error states show properly
- [ ] Loading states work
- [ ] Language switching persists

## Security Testing
- [ ] All queries scoped by tenantId
- [ ] User A cannot see User B data
- [ ] Slug validation prevents SQL injection
- [ ] Admin endpoints require auth
- [ ] API returns 403 on unauthorized
- [ ] XSS protection (sanitize user input)
- [ ] CSRF tokens working

## Performance Testing
- [ ] Config load < 1s
- [ ] Cache HIT < 100ms
- [ ] No duplicate API calls
- [ ] localStorage safe (quota handling)
- [ ] Lighthouse score > 90
- [ ] API response time < 200ms

## UX Testing
- [ ] Error messages user-friendly
- [ ] Loading skeleton shows
- [ ] Retry button visible on error
- [ ] No broken layouts
- [ ] Mobile responsive
- [ ] Accessible (WCAG AA)

## Browser Testing
- [ ] Chrome latest
- [ ] Firefox latest
- [ ] Safari latest
- [ ] Mobile (iOS/Android)
