# 🚀 QUICK START: TASK 6 (Verification Lokálně)

**Čas:** ~15 minut  
**Cíl:** Ověřit, že testy z PR #88 fungují na tvém počítači  
**Status:** Ready to go! 🎯

---

## 📋 Co Potřebuješ

- Node.js 18+ (check: `node --version`)
- npm (check: `npm --version`)
- Git (check: `git --version`)
- GitHub klón Lean_RPG repo

---

## ⚡ QUICK PATH (15 minut)

### Krok 1: Clone & Checkout

```bash
# Pokud ještě nemáš repo
git clone https://github.com/Keksiczek/Lean_RPG.git
cd Lean_RPG

# Checkout PR #88 branch
git checkout codex/finalize-multi-tenant-implementation
```

### Krok 2: Install Dependencies

```bash
cd frontend
npm install

# Čekej ~2-3 minuty...
# Expected: "added XXX packages"
```

### Krok 3: Run Tests

```bash
npm run test:coverage
```

**Expected Output:**
```
Test Files  4 passed (4)
Tests       21 passed (21) ✅
Coverage    ~90-95% ✅
```

---

## ✅ Pokud Všechno Prošlo

Pak **napíšeš na PR #88** komentář:

```
Verified locally ✅ - All 21 tests pass, coverage 90%+
Ready to merge!
```

---

## ❌ Pokud Něco Selže

### Problém: npm install fails
```bash
# Try:
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Problém: vitest not found
```bash
# Check vitest is installed
npx vitest --version

# If not, reinstall
rm -rf node_modules
npm install
```

### Problém: Tests fail
```bash
# Run with verbose output
npm run test -- --reporter=verbose

# Or specific test file
npm run test -- TenantContext.test.tsx
```

---

## 📚 Full Verification (Optional, 1 hour)

Pokud máš čas nebo backend běžící:

```bash
# Terminal 1: Tests + Build
cd frontend
npm install
npm run test:coverage    # ✅ Tests
npm run build           # ✅ Build

# Terminal 2: Frontend dev server
cd frontend
npm run dev
# → http://localhost:3001

# Terminal 3: Browser DevTools (když máš backend na :3000)
# Jdi na: http://localhost:3001/tenant/test-local/dashboard
# Check:
#   - Network tab: API calls < 1s ✅
#   - Application > localStorage: tenant:config:* ✅
#   - Console: No errors ✅
```

---

## 🎯 Merge Checklist

- [ ] npm install úspěšný
- [ ] npm run test:coverage - 21 tests pass
- [ ] Coverage > 90%
- [ ] npm run build - bez errors
- [ ] Komentář na PR #88
- [ ] PR merged to testing branch

---

## 📞 Pokud Máš Otázky

**Technical:** Otevři [Issue #89](https://github.com/Keksiczek/Lean_RPG/issues/89)

**Full Guide:** Čti [docs/TASK_6_VERIFICATION.md](./docs/TASK_6_VERIFICATION.md)

**Status:** Check [STATUS.md](./STATUS.md)

---

## 🚀 Dál Po Verification

```
1. ✅ TASK 6: Local verification (ty právě teď)
   ↓
2. 📦 TASK 7: Deploy to staging
   ↓
3. 🌍 TASK 8: Production deploy
```

---

**Ready?** Běž na to! 💪

```bash
cd Lean_RPG && git checkout codex/finalize-multi-tenant-implementation && cd frontend && npm install && npm run test:coverage
```

**Excited!** Codex dodal kompletní TASK 5 s 100% kvalitou. Teď je to na tobě. 🎉
