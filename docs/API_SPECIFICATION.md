# Multi-Tenant API Specification

## Public Endpoints

### GET /api/tenants/:slug/config
Load tenant configuration (cached 5 min)

**Response:**
```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": "clkd...",
      "slug": "magna-nymburk",
      "name": "Magna Exteriors Nymburk",
      "language": "cs",
      "timezone": "Europe/Prague",
      "primaryColor": "#1e3a8a",
      "secondaryColor": "#3b82f6"
    },
    "factories": [],
    "auditTemplates": [],
    "lpaTemplates": []
  }
}
```

### GET /api/tenants/:slug/config/refresh
Invalidate cache (admin only)

**Response:**
```json
{
  "success": true,
  "data": { "cacheCleared": true }
}
```

## Admin Endpoints

### POST /api/admin/tenants
Create tenant

### PUT /api/admin/tenants/:slug
Update tenant

### GET /api/admin/tenants
List all tenants (paginated)

## Error Codes
- 400: VALIDATION_ERROR, SLUG_EXISTS, INVALID_SLUG
- 404: TENANT_NOT_FOUND
- 401: UNAUTHORIZED
- 403: FORBIDDEN
- 500: INTERNAL_ERROR
