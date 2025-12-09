# Lean RPG Frontend

Next.js 14 aplikace s App Routerem pro autentizaci a základní herní dashboard.

## Spuštění
1. Zkopírujte `.env.local.example` na `.env.local` a nastavte `NEXT_PUBLIC_API_URL` na URL backendu (výchozí `http://localhost:3000`).
2. Nainstalujte závislosti: `npm install`
3. Spusťte dev server: `npm run dev` (poběží na portu 3001)

## Struktura
- `app/(auth)` obsahuje veřejné stránky `login` a `register`
- `app/(game)` obsahuje chráněné stránky s layoutem (dashboard, quests, areas)
- `components` sdílí UI prvky a layout komponenty
- `lib` obsahuje axios klient s JWT interceptorem a React Auth context
