# 🚀 Lean_RPG Backend

**Production-ready Express.js API** pro Lean RPG - gamifikovanou výukovou platformu zaměřenou na Lean metodiky v automotive průmyslu.

## 📊 Status

✅ **HOTOV A PRODUCTION-READY**

- 40+ API endpoints
- 15+ service tříd
- 40+ databázových tabulek
- 100% TypeScript strict mode
- Gemini AI integration
- Multi-tenant support
- JWT authentication + RBAC

## 🏗️ Technologický Stack

```
Node.js + Express.js + TypeScript
    ↓
PostgreSQL (Prisma ORM) + Redis
    ↓
Gemini API (AI feedback)
```

**Stack Details:**
- **Framework**: Express.js 4.19
- **Language**: TypeScript 5.4 (strict mode)
- **Database**: PostgreSQL 16 + Prisma 5.18
- **Cache**: Redis (ioredis)
- **Queue**: Bull + Redis
- **Auth**: JWT + bcryptjs
- **Validation**: Zod
- **Logging**: Winston
- **Containerization**: Docker + docker-compose

## 🎮 Co Backend Implementuje

### Core Features
- ✅ **Quest System** - Gamifikované úkoly s Lean tématy
- ✅ **Skill Tree** - Tier-based skill unlock systém
- ✅ **5S Audits** - Gamifikované 5S audity s scoring
- ✅ **Problem Solving** - Ishikawa diagram + root cause analysis
- ✅ **Gemba Walk** - Virtuální průchod továrnou
- ✅ **XP & Leveling** - Progression tracking
- ✅ **Badges & Achievements** - Gamification rewards
- ✅ **Leaderboard** - Global rankings
- ✅ **Multi-Tenant** - Tenant isolation pro více fabrik

### Advanced Features
- 🤖 **Gemini AI Integration** - Asynchronní feedback na submissions
- 📋 **Job Queue** - Bull + Redis pro background processing
- 🔄 **Circuit Breaker** - Fallback pro API failures
- 🔐 **Security** - RBAC, rate limiting, data isolation
- 📝 **Comprehensive Logging** - Winston + structured logging
- 🚀 **Performance** - Redis caching, optimized queries

## 📦 Instalace

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- npm nebo yarn

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/Keksiczek/Lean_RPG.git
cd Lean_RPG/backend

# 2. Setup environment
cp .env.example .env
# Edituj .env - nastav DATABASE_URL

# 3. Install dependencies
npm install

# 4. Setup database
npm run db:setup

# 5. Start development server
npm run dev

# 6. Verify health
curl http://localhost:4000/api/health
```

### Environment Variables

Viz `.env.example` pro kompletní seznam. Klíčové:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/lean_rpg

# Server
PORT=4000
NODE_ENV=development

# Authentication
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS
CORS_ORIGIN=http://localhost:5173
```

## 🐳 Docker

### Build

```bash
docker build -t lean-rpg-backend .
```

### Run with Docker Compose

```bash
docker-compose up -d
```

Toto spustí:
- Backend server (port 4000)
- PostgreSQL database (port 5432)
- Redis cache (port 6379)

## 📚 Dokumentace

### API Reference

Viz `docs/API_SPECIFICATION.md` pro:
- Kompletní seznam endpoints
- Request/response formáty
- Error codes
- Authentication

### Architecture

Viz `docs/ARCHITECTURE.md` pro:
- Systém design
- Data flow
- Security model
- Performance targets

### Deployment

Viz `docs/DEPLOYMENT_GUIDE.md` pro:
- Production setup
- Staging deployment
- Monitoring
- Rollback procedure

## 🚀 NPM Scripts

```bash
# Development
npm run dev              # Start with hot reload (ts-node-dev)

# Production
npm run build            # Compile TypeScript to dist/
npm start                # Run compiled server

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate:dev   # Create/run migration
npm run prisma:seed     # Seed test data
npm run db:setup        # Run migrations + seed
npm run db:reset        # Reset database completely

# Testing
npm run test            # Run vitest
npm run test:watch      # Watch mode

# Other
npm run lint            # Lint code (if configured)
npm run type-check      # Check TypeScript
```

## 📂 Struktura Projektu

```
src/
├── app.ts                  # Express app setup (25 routes)
├── config.ts               # Configuration management
├── index.ts                # Server entry point
│
├── routes/ (15 files)      # API endpoint handlers
│   ├── auth.ts            # Registration & login
│   ├── quests.ts          # Quest management
│   ├── submissions.ts     # Solution submission
│   ├── users.ts           # User profile
│   ├── areas.ts           # Game areas
│   ├── fiveS.ts           # 5S audit endpoints
│   ├── problemSolving.ts  # Ishikawa diagram
│   ├── skills.ts          # Skill tree
│   ├── progression.ts     # XP & level
│   ├── gamification.ts    # Badges & achievements
│   ├── gemba.ts           # Gemba walk
│   ├── jobs.ts            # Job status
│   ├── health.ts          # Health check
│   ├── tenants.ts         # Tenant info
│   ├── leaderboard.ts     # Leaderboard
│   └── admin/
│       └── tenants.ts     # Admin tenant management
│
├── services/ (15 files)    # Business logic
│   ├── GeminiService.ts     (283 lines) AI integration
│   ├── gembaService.ts      (891 lines) Gemba walk
│   ├── fiveSService.ts      (217 lines) 5S audits
│   ├── skillTreeService.ts  (184 lines) Skill unlock
│   ├── progressionService.ts (160 lines) XP tracking
│   ├── problemSolvingService.ts (165 lines) Ishikawa
│   ├── badgeService.ts      (95 lines) Badge logic
│   ├── achievementService.ts (82 lines) Achievements
│   ├── leaderboardStatsService.ts (118 lines) Rankings
│   └── ... (6 more services)
│
├── middleware/ (8 files)   # Request processing
│   ├── auth.ts             # JWT verification
│   ├── errorHandler.ts     # Error handling
│   ├── rateLimiter.ts      # Rate limiting
│   ├── logger.ts           # Request logging
│   ├── validation.ts       # Input validation
│   ├── tenantContext.ts    # Multi-tenant
│   ├── dataIsolation.ts    # Data safety
│   ├── areaAccessControl.ts # Permissions
│   └── errors.ts           # Exception classes
│
├── lib/ (7 files)          # Utilities
│   ├── logger.ts           # Winston setup
│   ├── prisma.ts           # DB singleton
│   ├── redis.ts            # Cache setup
│   ├── circuitBreaker.ts   # Fallback pattern
│   ├── xp.ts               # XP calculations
│   ├── geminiPrompt.ts     # AI prompts
│   └── geminiTypes.ts      # TypeScript types
│
├── types/                  # TypeScript definitions
├── data/                   # Seed data
└── queue/                  # Job queue logic

prisma/
├── schema.prisma           # Database models (800+ lines)
├── seed.ts                 # Test data
├── migrations/             # Migration history
└── problemSolvingChallenges.ts  # Challenge data

├── Dockerfile              # Production image
├── docker-compose.yml      # Local development
├── tsconfig.json           # TypeScript config
├── package.json            # Dependencies
└── .env.example            # Environment template
```

## 🗄️ Databáze

### Model Diagram

```
User (29 fields)
  ├── email, password, role
  ├── totalXp, level
  └── Relations: quests, skills, badges, audits, submissions

Quest (13 fields)
  ├── title, story, leanConcept, difficulty
  ├── xpReward, skillUnlock
  └── Area relation

Area (5 fields)
  ├── name, description
  └── Relations: quests, audits, 5S settings

SkillTreeNode (13 fields)
  ├── Tier-based progression
  ├── requiresSkills[]
  └── unlockType, unlockData

PlayerSkill (11 fields)
  ├── level, progress, isUnlocked
  ├── masteryLevel
  └── timestamps

FiveSAudit (17 fields)
  ├── Status: in_progress → completed
  ├── sortScore, orderScore, shineScore, etc.
  ├── problemsFound, aiFeedback
  └── xpGain, badgeEarned

ProblemAnalysis (24 fields)
  ├── selectedCategories, causes, rootCause
  ├── proposedSolution, solutionQuality
  ├── aiFeedback, categoryFeedback
  └── xpGain, completedAt, timeSpent

Tenant (15 fields)
  ├── slug, name, language, theme
  ├── primaryColor, secondaryColor
  └── Relations: users, factories, templates
```

## 🔐 Security

### Authentication
- JWT token-based
- Bcryptjs password hashing
- 7-day token expiration (configurable)
- Bearer token in Authorization header

### Authorization
- Role-based access control (RBAC)
- Admin/operator roles
- Area-based permissions
- Tenant isolation

### Data Protection
- Tenant data isolation (tenantId filtering)
- SQL injection prevention (Prisma)
- CORS configured
- Rate limiting (100 req/min global, 5/min submissions)
- Input validation (Zod)
- Error message filtering

## 🚨 Error Handling

Všechny errors jsou strukturované:

```json
{
  "success": false,
  "error": "Meaningful error message",
  "code": "ERROR_CODE",
  "statusCode": 400,
  "timestamp": "2025-12-12T10:00:00Z"
}
```

**Custom Exception Classes:**
- `ValidationError` (400)
- `AuthenticationError` (401)
- `AuthorizationError` (403)
- `NotFoundError` (404)
- `ConflictError` (409)
- `ServerError` (500)

## 📊 Monitoring & Logging

### Winston Logger

```javascript
// Automatic logging of:
- HTTP requests (method, path, status, duration)
- Errors (stack trace, context)
- Business events (quest start, XP gained, etc.)
- Job queue events
```

### Log Files

```
logs/
├── server.log      # All logs
├── error.log       # Only errors
└── combined.log    # JSON format
```

### Health Check

```bash
GET /api/health

Response:
{
  "status": "ok",
  "uptime": 12345,
  "timestamp": "2025-12-12T10:00:00Z"
}
```

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

Tests pro:
- Service business logic
- Utility functions
- Error handling

### Integration Tests (Future)

- API endpoint testing
- Database transactions
- Authentication flow

## 🚀 Deployment

### Development

```bash
npm run dev
```

### Staging

```bash
# Build
npm run build

# Setup environment
cp .env.example .env.staging
# Edit with staging values

# Run
NODE_ENV=staging npm start
```

### Production

```bash
# Via Docker
docker build -t lean-rpg-backend:prod .
docker run -d \
  --name lean-rpg \
  --env-file .env.prod \
  -p 4000:4000 \
  lean-rpg-backend:prod

# Via Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

**Deployment Checklist:**
- [ ] Generate JWT_SECRET: `openssl rand -base64 32`
- [ ] Setup PostgreSQL production instance
- [ ] Configure Redis (or use managed service)
- [ ] Add GEMINI_API_KEY
- [ ] Enable HTTPS
- [ ] Setup error tracking (Sentry)
- [ ] Configure firewall rules
- [ ] Setup monitoring & alerts
- [ ] Database backup automation
- [ ] Log aggregation (ELK, etc.)

Viz `docs/DEPLOYMENT_GUIDE.md` pro detaily.

## 🔧 Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED
```

**Řešení:**
```bash
# 1. Verify PostgreSQL is running
psql -U postgres -c "SELECT 1"

# 2. Check DATABASE_URL in .env
echo $DATABASE_URL

# 3. Run migrations
npm run prisma:migrate:dev
```

### JWT_SECRET Not Found

```
Error: JWT_SECRET not found in environment
```

**Řešení:**
```bash
# Generate and add to .env
openssl rand -base64 32
```

### Prisma Client Error

```
Prisma Client is not compatible
```

**Řešení:**
```bash
npm run prisma:generate
npm run build
npm start
```

### Redis Connection Timeout

```
Error: connect ETIMEDOUT
```

**Řešení:**
```bash
# Check Redis is running
redis-cli ping

# Verify REDIS_HOST and REDIS_PORT in .env
```

## 📖 Další Dokumentace

- **API_SPECIFICATION.md** - Kompletní API reference
- **ARCHITECTURE.md** - System design a data flow
- **DEPLOYMENT_GUIDE.md** - Production deployment
- **docs/MULTI_TENANT_SETUP.md** - Jak přidat nového tenanta
- **docs/QA_CHECKLIST.md** - Testing checklist

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes
3. Test: `npm run test && npm run build`
4. Push: `git push origin feature/your-feature`
5. Create Pull Request

## 📝 License

MIT

## 📞 Support

**Issues?**
- Check GitHub Issues: https://github.com/Keksiczek/Lean_RPG/issues
- Review logs: `tail -f logs/server.log`
- Check error codes in API_SPECIFICATION.md

**Questions?**
- Read docs in `docs/` folder
- Check Troubleshooting section above

---

**Status:** ✅ Production-ready  
**Updated:** 12. prosince 2025  
**Version:** 0.1.0
