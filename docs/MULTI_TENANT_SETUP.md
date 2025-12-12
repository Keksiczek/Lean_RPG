# Multi-Tenant Setup Guide

## Adding New Tenant (5 minutes)

### 1. Database (Backend)
```bash
curl -X POST http://localhost:3000/api/admin/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "acme-manufacturing",
    "name": "ACME Manufacturing",
    "language": "en",
    "timezone": "America/Chicago",
    "primaryColor": "#FF5733"
  }'
```

### 2. Seed Data
```bash
npx prisma db seed -- --tenant acme-manufacturing
```

### 3. Verify
```bash
curl http://localhost:3000/api/tenants/acme-manufacturing/config
```

### 4. Frontend
```
Go to: http://localhost:5173/tenant/acme-manufacturing/dashboard
```

## Config JSON Schema

```json
{
  "slug": "string (alphanumeric-dash)",
  "name": "string",
  "language": "en|cs|de",
  "timezone": "IANA timezone",
  "primaryColor": "#hexcolor",
  "secondaryColor": "#hexcolor",
  "leanMethodologies": ["5S", "LPA", "Ishikawa"],
  "maxPlayers": 1000
}
```

## Examples

### Magna Exteriors Nymburk
```json
{
  "slug": "magna-nymburk",
  "name": "Magna Exteriors Nymburk",
  "language": "cs",
  "timezone": "Europe/Prague",
  "primaryColor": "#1e3a8a",
  "secondaryColor": "#3b82f6"
}
```

### Škoda Mladá Boleslav
```json
{
  "slug": "skoda-mlada-boleslav",
  "name": "Škoda Mladá Boleslav",
  "language": "cs",
  "timezone": "Europe/Prague",
  "primaryColor": "#C3122E",
  "secondaryColor": "#1a1a1a"
}
```
