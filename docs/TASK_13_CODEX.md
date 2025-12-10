# 🩺 CODEX SPEC: Health Check Endpoint (Issue #46)

**Datum**: 2025-12-09  
**Priorita**: 🔴 CRITICAL (prod readiness)  
**Status**: Ready for Codex  
**Čas**: ~2-3 hodiny

---

## 📌 KONTEKT

Produkční prostředí potřebuje spolehlivý health check, který ověří klíčové závislosti backendu. Bez jednotného endpointu nelze snadno zapojit monitoring ani orchestrace (Docker Compose, k8s) a incidenty se hůř odhalují. Issue **#46** vyžaduje implementaci tohoto kontrolního bodu.

---

## 🎯 CÍL

Vytvořit **/health** endpoint, který vrací strukturovaný JSON s aktuálním stavem:
- ✅ Aplikace běží a měří uptime (sekundy)
- ✅ Databáze (Prisma) je dosažitelná
- ✅ Redis (pokud je zapnutý) odpovídá na ping
- ✅ Gemini integrace je dostupná nebo signalizuje důvod nedostupnosti
- ✅ Základní metriky (paměť, hostname) pro rychlou diagnostiku
- ✅ HTTP status 200 pro „ok“, 503 pro „degraded/unavailable“

---

## 📋 KONKRÉTNÍ IMPLEMENTACE

### 1) Backend route `GET /health`
- **Soubor**: `backend/src/routes/health.ts` (nový)
- **Logika**:
  - Paralelně ověřit:
    - Prisma: `prisma.$queryRaw` (např. `SELECT 1`)
    - Redis: pokud je klient k dispozici, použít `ping()` a měřit latenci
    - Gemini: pokus o „lightweight“ požadavek (např. `projects.locations.models.list` či konfigurace) obalený timeoutem; pokud není API klíč, vrátit stav `skipped`
  - Nasbírat systémové údaje: `process.uptime()`, `process.memoryUsage()`, `os.hostname()`
  - Vyhodnotit agregovaný status: pokud některá klíčová závislost selže → `status: "degraded"` a HTTP 503
  - Návratová struktura (příklad):
    ```json
    {
      "status": "ok" | "degraded",
      "details": {
        "database": "connected" | "error:<msg>",
        "redis": "connected" | "skipped" | "error:<msg>",
        "gemini": "connected" | "skipped" | "timeout" | "error:<msg>",
        "uptime": 123.45,
        "memory": { "rss": 0, "heapUsed": 0 },
        "hostname": "..."
      }
    }
    ```

### 2) Express registrace nové route
- **Soubor**: `backend/src/index.ts`
- Importovat a namountovat `healthRouter` pod `/health` před catch-all error handler.

### 3) Konfigurace a helpery
- **Soubor**: `backend/src/lib/redis.ts` nebo stávající klient
  - Pokud již existuje Redis klient, exportovat helper `isRedisEnabled` nebo flag podle env.
- **Soubor**: `backend/src/services/gemini.ts` (pokud existuje)
  - Přidat lehký `ping` helper s timeoutem, který vrací strukturu `{ ok: boolean, error?: string }`.

### 4) Testy
- **Soubor**: `backend/tests/health.test.ts` (nový)
  - Mock Prisma/Redis/Gemini a ověřit, že route vrací správný HTTP status a JSON strukturu pro stavy `ok` i `degraded`.
  - Otestovat scénáře: chybějící GEMINI_API_KEY → `skipped`, výpadek DB → 503.

### 5) Dokumentace
- **Soubor**: `README.md`
  - Přidat krátkou sekci „Health check“ s příkladem odpovědi a využitím v Docker Compose.

---

## ✅ ACCEPTANCE CRITERIA
- `/health` vrací 200 s `status: "ok"` pokud DB (a Redis/Gemini, jsou-li povoleny) odpovídají.
- `/health` vrací 503 a `status: "degraded"` pokud některá klíčová závislost selže, včetně detailní chybové zprávy.
- Testy pokrývají úspěch i selhání (DB, Redis, Gemini).
- Dokumentace popisuje použití endpointu a očekávaný JSON.

---

## 🧠 POZNÁMKY PRO DEVELOPERA
- Použij krátké timeouty pro Gemini ping, aby health check nezdržoval (např. 1–2s).
- Loguj selhání závislostí se `requestId`, pokud už existuje middleware.
- Ujisti se, že endpoint nevrací citlivé údaje (API klíče, connection stringy). Jen statusy a latence.
- Pro testy lze Prisma/Redis/Gemini mockovat; není nutné spouštět reálné služby.
