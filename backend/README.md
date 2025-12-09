# Lean RPG Training App - Backend

Node.js + TypeScript backend for the Lean RPG Training App. Uses Express, Prisma, SQLite (for local development), Redis-backed background jobs, structured logging (Winston), and resilient Gemini integration for submissions.

## Prerequisites
- Node.js (LTS recommended)
- npm
- Redis (for background job queue)

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Generate Prisma client:
   ```bash
   npx prisma generate
   ```
3. Run database migrations (creates/updates `dev.db` locally):
   ```bash
   npx prisma migrate dev --name init
   # New field for submission status
   npx prisma migrate dev --name add_submission_status
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

Environment variables are listed in `.env.example`. Copy it to `.env` and adjust as needed.

## Environment variables
- `APP_NAME` – Human-readable app label for logs/health responses (defaults to `Lean RPG Backend`).
- `DATABASE_URL` – SQLite connection string for local development (defaults to `file:./dev.db`).
- `JWT_SECRET` – Secret used to sign and verify JWT tokens (required).
- `PORT` – Port for the Express server (defaults to `4000`).
- `GEMINI_API_KEY` – Optional; if absent, the app returns fallback AI analysis and keeps the server healthy.
- `REDIS_URL` – Redis connection string (defaults to `redis://localhost:6379`).
- `LOG_LEVEL` – Winston logger level (`error`, `warn`, `info`, `debug`). Default adjusts to `info` in production and `debug` otherwise.
- `ENABLE_HTTP_LOGS` – Toggle request logging middleware (`true`/`false`).

## Project Structure
- `src/index.ts` – Express server entrypoint with routes and middleware wiring.
- `src/routes/` – Route handlers for auth, users, quests, submissions, and areas.
- `src/middleware/auth.ts` – JWT authentication middleware.
- `src/middleware/logger.ts` – Request logging middleware attaching `requestId` to logs and responses.
- `src/middleware/errorHandler.ts` – Centralized error handling with JSON responses and request IDs.
- `src/lib/prisma.ts` – Prisma client singleton.
- `src/lib/gemini.ts` – Gemini API integration with retry + circuit breaker + fallback.
- `src/lib/logger.ts` – Winston logger singleton used across the app.
- `src/lib/xp.ts` – XP calculation and leveling helpers.
- `src/queue/geminiJobs.ts` – Bull queue wiring for async Gemini processing.
- `src/services/GeminiService.ts` – Worker logic to analyze submissions and update XP.
- `prisma/schema.prisma` – Database schema and Prisma setup.

## AI / Gemini integration
- `POST /submissions` enqueues a Gemini analysis job via Redis/Bull and returns immediately with `pending_analysis` status.
- A worker processes the queue, updates AI feedback/score/risk level, and logs XP gains.
- Retry with exponential backoff plus a circuit breaker guards Gemini availability; if Gemini is down, fallback analysis prevents outages.
- The Gemini prompt is tailored for lean/5S coaching (see `src/lib/geminiPrompt.ts`).
- Configure `GEMINI_API_KEY` in `.env` to enable real calls; otherwise, fallback analysis is used.

## XP and leveling system
- XP gain for a submission uses quest `baseXp`, average 5S score bonuses/maluses, and risk-level bonuses (see `src/lib/xp.ts`).
- XP gains are logged in `XpLog`, stored on `Submission.xpGain`, and aggregated into `User.totalXp`.
- Level information is computed via a quadratic curve (`100 * level^2`) and returned from `GET /users/me` as `levelInfo`.

## API Endpoints (overview)
- `GET /health` – Health check with DB/Redis status and uptime.
- `POST /auth/register` – Create user and return JWT (rate limited).
- `POST /auth/login` – Login and return JWT (rate limited).
- `GET /auth/me` – Returns the current authenticated user (requires auth).
- `GET /users/me` – Get current user profile (requires auth).
- `PUT /users/me` – Update basic profile fields (requires auth).
- `GET /areas` – List areas (requires auth).
- `POST /areas` – Create area (admin only; requires auth).
- `GET /quests` – List active quests (requires auth).
- `POST /quests/assign` – Assign quest to current user (requires auth).
- `GET /quests/my` – List current user's quests with submissions (requires auth).
- `POST /submissions` – Create submission, enqueue AI feedback + XP processing, returns `pending_analysis` (requires auth).
- `GET /submissions/:id` – Detailed submission view with quest/workstation context, status, and XP info (requires auth + owner/admin/ci).

### Auth endpoints
- `POST /auth/register`
  - Body: `{ "email": string, "password": string (min 8 chars), "name": string }`
  - Response: `{ user: { id, email, name, role, totalXp, level, createdAt }, token }`
- `POST /auth/login`
  - Body: `{ "email": string, "password": string }`
  - Response: `{ user: { id, email, name, role, totalXp, level, createdAt }, token }`
- `GET /auth/me`
  - Header: `Authorization: Bearer <JWT>`
  - Response: `{ user: { id, email, name, role, totalXp, level, createdAt } }`
- `GET /users/me`
  - Header: `Authorization: Bearer <JWT>`
  - Response: `{ id, email, name, role, totalXp, level, createdAt, updatedAt }`
- `PUT /users/me`
  - Header: `Authorization: Bearer <JWT>`
  - Body: `{ "name"?: string }`
  - Response: Updated user profile without password fields.

## Endpoint examples
### POST /submissions
```json
{
  "userQuestId": 1,
  "workstationId": 2,
  "textInput": "Popis problému nebo zlepšení...",
  "imageUrl": "https://example.com/photo.jpg"
}
```
Response returns `202 Accepted` with stored submission fields and `status: "pending_analysis"`. AI feedback and XP are filled asynchronously by the worker.

### GET /submissions/:id
Returns submission detail with nested `userQuest`, `quest`, `workstation` (and area), AI fields, `status`, and `xpGain`.

### GET /users/me
Example response shape:
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "Operator",
  "role": "operator",
  "totalXp": 180,
  "level": 1,
  "createdAt": "2024-07-11T10:20:30.000Z",
  "updatedAt": "2024-07-11T10:20:30.000Z"
}
```

## Notes
- Default port is `4000` (configurable via `.env`).
- Rate limiting (10 requests / 15 minutes per IP) is applied to `/auth/signup` and `/auth/login`.
- Validation uses `zod` on auth and submissions routes.
- Structured logs are JSON-formatted, stored in `combined.log` / `error.log`, and tagged with `requestId`.
- Background job processing requires Redis reachable at `REDIS_URL`.

## Docker
Build and run the API with Redis locally:
```bash
docker-compose up --build
```
This starts the API on port `4000` and a Redis instance. SQLite data is persisted via the `sqlite_data` volume.
