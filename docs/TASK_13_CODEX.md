# 🩺 CODEX TASK 13 – Health Check Endpoint & Observability

**Issue**: https://github.com/Keksiczek/Lean_RPG/issues/46
**Datum**: 2025-12-09
**Priorita**: 🔴 CRITICAL (prod readiness blocker)
**Časový odhad**: 2–3 hodiny
**Stav**: Ready for implementation

---

## 🎯 Cíl

Přidat robustní health check endpoint, který spolehlivě reflektuje stav backendu i závislostí. Endpoint musí být vhodný pro produkční monitoring (Docker/Compose, Kubernetes readiness/liveness) a poskytnout rychlou diagnostiku pro debugging i alerting.

---

## ✅ Deliverables

1. **Endpoint** `GET /health` vracející JSON se statusy klíčových subsystémů.
2. **Kontroly**:
   - **Database** – pokus o jednoduchý dotaz přes Prisma (`SELECT 1` ekvivalent), výsledkem `connected`/`disconnected`.
   - **Redis** – `ping` přes klienta (pokud Redis nedostupný, uvést `disconnected` a chybovou hlášku).
   - **Process metrics** – uptime (s), paměť (rss/heapUsed), případně cpuLoad (pokud snadno dostupné přes `os` modul).
   - **Gemini circuit state** – pokud existuje circuit breaker, vypiš `closed/open/half_open` a počty selhání; pokud ještě neexistuje, vrátit placeholder `unavailable`.
3. **HTTP status**:
   - `200 OK` pokud všechny povinné kontroly vrátí „connected/ok“.
   - `503 Service Unavailable` pokud některá povinná kontrola selže (DB nebo Redis).
4. **Struktura odpovědi** (příklad):
   ```json
   {
     "status": "ok", // nebo "degraded" / "error"
     "details": {
       "database": "connected",
       "redis": "connected",
       "gemini_circuit": "closed",
       "gemini_failures": 0,
       "gemini_last_failure": null,
       "memory": { "rss": 123456, "heapUsed": 78910 },
       "uptime": 123.45,
       "hostname": "backend-1"
     }
   }
   ```
5. **Testy** – přidat integrační testy pro `/health` (happy path + simulace selhání DB/Redis pomocí mocking/stubů).
6. **Dokumentace** – krátká sekce do README nebo `docs/game-flow.md` popisující endpoint a návratové kódy.

---

## 🔍 Implementation Notes

- **Umístění**: `backend/src/routes/health.ts` + registrace v `backend/src/index.ts` (preferrably `/api/health`).
- **Prisma check**: použij `prisma.$queryRaw` nebo `prisma.$queryRawUnsafe` s jednoduchým dotazem; obalit try/catch a vrátit diagnostiku.
- **Redis check**: využij existující Redis klient (pokud ještě není, vytvoř jednoduchý wrapper v `backend/src/lib/redis.ts`).
- **Metrics**: `process.uptime()`, `process.memoryUsage()`, `os.hostname()`.
- **Status inference**: Pokud DB OK, Redis OK → `status: "ok"`; pokud jeden z nich spadne → `status: "error"`; pokud jen volitelné části (Gemini) nedostupné → `status: "degraded"`.
- **Error handling**: nenarušuj globální error handler; endpoint by měl vrátit chybu přímo, nevyhazovat nestrukturované exceptions.
- **Typování**: Přidej `HealthStatus`/`HealthDetails` typy pro jasnou strukturu response.

---

## ✅ Acceptance Criteria

- `GET /health` vrací 200 a detailní JSON při zdravém stavu.
- `GET /health` vrací 503 když DB nebo Redis nedostupný; odpověď obsahuje pole `error` nebo `details` s popisem.
- Lint/tests pro backend prochází (`npm run lint`, `npm run test`).
- Dokumentace aktualizovaná s příklady odpovědí.

---

## 🧪 Test Plan

1. **Happy path**: Spusť backend s dostupnou DB a Redis, ověř `GET /health` → 200 + `status: ok`.
2. **DB down**: Zastav databázi, ověř `GET /health` → 503 + `database: disconnected`.
3. **Redis down**: Zastav Redis, ověř `GET /health` → 503 + `redis: disconnected`.
4. **Gemini placeholder**: Pokud není implementováno, vrátit `gemini_circuit: unavailable`.
5. **Automated**: backend `npm run test` pokrývá alespoň happy path a simulaci selhání.

---

## 📦 Notes for Ops

- Endpoint je vhodný pro Docker healthcheck: `CMD curl -f http://localhost:4000/health || exit 1`.
- V Kubernetes lze použít jako `livenessProbe` a `readinessProbe`.
- Loguj selhání health checku na úrovni `warn` pro rychlou detekci anomálií.
