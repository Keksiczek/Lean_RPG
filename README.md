# Lean_RPG

Lean_RPG is a learning-focused RPG that guides players through Lean concepts using quests and AI-powered feedback.

## Quest & Submission Flow

1. **User accepts quest** – `POST /api/quests/:id/accept` creates a `UserQuest` to track progress.
2. **User submits solution** – `POST /api/submissions` with `{ questId, content }` stores the attempt with `pending_analysis` status and enqueues Gemini analysis.
3. **Gemini analysis** – background worker evaluates the submission, generates feedback, and calculates XP rewards.
4. **Feedback & XP** – the submission is updated to `evaluated`, XP is logged, and the user sees rewards in the UI.
5. **Polling** – the frontend polls `/api/submissions/:id` to show status and feedback when ready.

See [`docs/game-flow.md`](docs/game-flow.md) for the full lifecycle and state machine.

## Development

- Backend: Express + Prisma (TypeScript)
- Frontend: Next.js + Tailwind CSS

### Useful Scripts

From the `backend/` directory:
- `npm run dev` – start the API server
- `npm run lint` – lint backend code
- `npm run test` – run backend tests

From the `frontend/` directory:
- `npm run dev` – start the Next.js dev server
- `npm run lint` – lint frontend code

### Roadmap

Progress and milestones are tracked in `CODEX_STATUS_ANALYSIS.md`.
