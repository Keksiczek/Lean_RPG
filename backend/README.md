# Lean RPG Training App - Backend

Node.js + TypeScript backend for the Lean RPG Training App. Uses Express, Prisma, SQLite (for local development) and integrates Google Gemini analysis for submissions.

## Prerequisites
- Node.js (LTS recommended)
- npm

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
   npx prisma migrate dev --name add_submission_xp_gain
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

Environment variables are listed in `.env.example`. Copy it to `.env` and adjust as needed.

## Project Structure
- `src/index.ts` – Express server entrypoint with routes and middleware wiring.
- `src/routes/` – Route handlers for auth, users, quests, submissions, and areas.
- `src/middleware/auth.ts` – JWT authentication middleware.
- `src/lib/prisma.ts` – Prisma client singleton.
- `src/lib/gemini.ts` – Gemini API integration helper.
- `src/lib/xp.ts` – XP calculation and leveling helpers.
- `prisma/schema.prisma` – Database schema and Prisma setup.

## AI / Gemini integration
- `POST /submissions` automatically calls Gemini to analyze a submission.
- Response stores AI feedback, 5S score, and risk level on the `Submission` record.
- The Gemini prompt is tailored for lean/5S coaching (see `src/lib/geminiPrompt.ts`).
- Configure `GEMINI_API_KEY` in `.env` to enable real calls (placeholder endpoint included with TODO for final URL).

## XP and leveling system
- XP gain for a submission uses quest `baseXp`, average 5S score bonuses/maluses, and risk-level bonuses (see `src/lib/xp.ts`).
- XP gains are logged in `XpLog`, stored on `Submission.xpGain`, and aggregated into `User.totalXp`.
- Level information is computed via a quadratic curve (`100 * level^2`) and returned from `GET /users/me` as `levelInfo`.

## API Endpoints (overview)
- `GET /health` – Health check.
- `POST /auth/signup` – Create user and return JWT (rate limited).
- `POST /auth/login` – Login and return JWT (rate limited).
- `GET /users/me` – Get current user profile with `levelInfo` (requires auth).
- `GET /areas` – List areas (requires auth).
- `POST /areas` – Create area (admin only; requires auth).
- `GET /quests` – List active quests (requires auth).
- `POST /quests/assign` – Assign quest to current user (requires auth).
- `GET /quests/my` – List current user's quests with submissions (requires auth).
- `POST /submissions` – Create submission, triggers AI feedback + XP processing (requires auth).
- `GET /submissions/:id` – Detailed submission view with quest/workstation context and XP info (requires auth + owner/admin/ci).

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
Response includes stored submission fields, AI feedback, `aiScore5s`, `aiRiskLevel`, and `xpGain`.

### GET /submissions/:id
Returns submission detail with nested `userQuest`, `quest`, `workstation` (and area), AI fields, and `xpGain`.

### GET /users/me
Example response shape:
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "Operator",
  "role": "operator",
  "totalXp": 180,
  "levelInfo": {
    "level": 1,
    "currentLevelXp": 100,
    "nextLevelXp": 400,
    "xpToNextLevel": 220
  }
}
```

## Notes
- Default port is `4000` (configurable via `.env`).
- Rate limiting (10 requests / 15 minutes per IP) is applied to `/auth/signup` and `/auth/login`.
- Validation uses `zod` on auth and submissions routes.
