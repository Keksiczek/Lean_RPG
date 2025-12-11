# 🎮 Lean_RPG Game Design Document

## MVP Quest Structure

### 10 Core Quests

| Code | Title | Concept | XP | Difficulty | Unlock |
|------|-------|---------|-----|-----------|--------|
| quest_5s_workplace | Organizuj pracovní stanici | 5S | 100 | Easy | 5S_Level_1 |
| quest_kaizen_continuous | Kaizen - malá zlepšení | Kaizen | 150 | Medium | Kaizen_Level_1 |
| quest_5why_root_cause | 5 Why analýza | Problem Solving | 200 | Medium | ProblemSolving_Level_1 |
| quest_ishikawa_diagram | Ishikawa diagram | Problem Solving | 180 | Medium | - |
| quest_muda_identification | Identifikuj Muda | 5S | 120 | Easy | 5S_Level_2 |
| quest_standard_work | Dokumentuj standard work | Standard Work | 140 | Medium | StandardWork_Level_1 |
| quest_audit_5s | Proveď 5S audit | 5S | 110 | Easy | - |
| quest_mura_balancing | Vyrovnaj zátěž | Kaizen | 250 | Hard | Kaizen_Level_2 |
| quest_gemba_walk | Gemba Walk | Gemba | 100 | Easy | Gemba_Level_1 |
| quest_poka_yoke | Poka-Yoke design | Problem Solving | 220 | Hard | ProblemSolving_Level_2 |

### XP Progression

- **Easy (10-20 min):** 100-120 XP
- **Medium (25-40 min):** 140-200 XP
- **Hard (35-60 min):** 220-250 XP

**Level Progression:**
- Level 1: 0 XP
- Level 2: 500 XP
- Level 3: 1,200 XP
- Level 4: 2,200 XP
- Level 5: 3,500 XP
- (+500 XP per level after)

### Skill Unlock Tree

5S_Level_1 (quest_5s_workplace)
└─ 5S_Level_2 (quest_muda_identification)

Kaizen_Level_1 (quest_kaizen_continuous)
└─ Kaizen_Level_2 (quest_mura_balancing)

ProblemSolving_Level_1 (quest_5why_root_cause)
└─ ProblemSolving_Level_2 (quest_poka_yoke)

StandardWork_Level_1 (quest_standard_work)

Gemba_Level_1 (quest_gemba_walk)


### Lean Concepts Covered

✅ 5S (Sort, Set, Shine, Standardize, Sustain)
✅ Kaizen (Continuous Improvement)
✅ Problem Solving (5 Why, Ishikawa)
✅ Standard Work
✅ Gemba (Real place)
✅ Muda (Waste)
✅ Mura (Unevenness)
✅ Poka-Yoke (Error prevention)
✅ ACCEPTANCE CRITERIA
 backend/prisma/schema.prisma obsahuje Quest a UserQuest modely

 backend/src/data/quests.json má všech 10 questů

 backend/prisma/seed.ts je správně implementován

 npm run prisma:migrate projde bez chyb

 npm run db:setup vyplní 10 questů v DB

 npm run build projde bez TypeScript errorů

 Všechny objectives jsou JSON array

 XP rewards jsou realističné (100-250)

 docs/GAME_DESIGN.md je úplný

 Všechny tasky jsou bez TS errors
