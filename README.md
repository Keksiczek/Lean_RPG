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

## 🐳 Docker Setup (Development)

### Prerequisites
- Docker & Docker Compose installed

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone https://github.com/Keksiczek/Lean_RPG.git
   cd Lean_RPG
   ```
2. **Create environment file**
   ```bash
   cp .env.docker.example .env
   ```
   (Edit `.env` if you want to override the defaults.)
3. **Start all services**
   ```bash
   docker-compose up -d
   ```
   This starts:
   - PostgreSQL on `localhost:5432`
   - Redis on `localhost:6379`
   - Backend API on `localhost:4000`
4. **Wait for services to be healthy**
   ```bash
   docker-compose ps
   ```
   All services should show `healthy`.
5. **Initialize database**
   ```bash
   docker-compose exec backend npm run prisma:migrate
   docker-compose exec backend npm run prisma:seed
   ```
6. **Verify the setup**
   ```bash
   curl http://localhost:4000/health
   ```
   Expected response (status 200):
   ```json
   {
     "status": "ok",
     "details": {
       "database": "connected",
       "redis": "connected",
       "memory": { "used": "...", "rss": "..." },
       "uptime": 0,
       "gemini_circuit": "closed",
       "gemini_failures": 0,
       "gemini_last_failure": null,
       "hostname": "..."
     }
   }
   ```

### Useful Docker Commands

- Start services: `docker-compose up -d`
- Stop services: `docker-compose down`
- Stop and remove volumes (⚠️ deletes data): `docker-compose down -v`
- View logs (all): `docker-compose logs -f`
- View logs (single service): `docker-compose logs -f backend` (or `postgres`, `redis`)
- Run Prisma migration: `docker-compose exec backend npm run prisma:migrate`
- Open shell in backend: `docker-compose exec backend /bin/sh`
- Check PostgreSQL: `docker-compose exec postgres psql -U lean_rpg_user -d lean_rpg_dev`
- Rebuild after code changes: `docker-compose build --no-cache && docker-compose up -d`

### Port Mappings

| Service    | Host Port | Container Port | Connection String             |
|------------|-----------|----------------|------------------------------|
| Backend    | 4000      | 4000           | http://localhost:4000        |
| PostgreSQL | 5432      | 5432           | postgresql://localhost:5432  |
| Redis      | 6379      | 6379           | redis://localhost:6379       |

### Troubleshooting

- **Database connection error**
  ```bash
  docker-compose ps postgres
  docker-compose logs postgres
  ```
- **Redis connection error**
  ```bash
  docker-compose ps redis
  docker-compose exec redis redis-cli ping
  ```
- **Backend not starting**
  ```bash
  docker-compose logs backend
  ```
  Ensure ports `4000`, `5432`, and `6379` are free.
- **Full rebuild**
  ```bash
  docker-compose down -v
  docker-compose up -d --build
  ```

### Roadmap

Progress and milestones are tracked in `CODEX_STATUS_ANALYSIS.md`.
