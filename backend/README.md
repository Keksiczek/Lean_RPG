# Backend

Express + Prisma API for Lean_RPG.

## Gemini Integration
- Submissions are stored with status `pending_analysis` and enqueued for Gemini processing.
- Gemini analysis updates the submission with feedback, score, and XP gain.
- XP changes are logged in `XpLog` and aggregated on the user record.

## Running locally
- `npm run dev` – start the API server
- `npm run lint` – lint backend code
- `npm run test` – run backend tests
- `npm run prisma:seed` – seed Magna Nymburk production dataset
- `npm run verify:seed` – validate seeded hierarchy and templates
