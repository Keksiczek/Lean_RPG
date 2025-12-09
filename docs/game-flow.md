# Quest Lifecycle

## Flow Diagram
```
User browses /quests (active quests)
        ↓
Clicks "Accept quest" (POST /api/quests/:id/accept)
        ↓
UserQuest created (status: in_progress)
        ↓
Opens /quests/:id detail
        ↓
Submits solution (POST /api/submissions)
        ↓
Submission stored (pending_analysis) + Gemini job enqueued
        ↓
Gemini analyzes → feedback + xpGain
        ↓
UserQuest status updated to evaluated
        ↓
User sees feedback + XP reward
```

## State Machine
- **Quest**: `active` / `inactive`
- **UserQuest**: `not_started` → `in_progress` → `evaluated` → `completed` / `abandoned`
- **Submission**: `submitted` → `pending_analysis` → `evaluated` / `failed` (with feedback + xpGain)

`failed` covers Gemini outages or timeouts; frontend shows a friendly message and stops polling after ~30s.

## Database Relationships
```
Quest (1) ─── (N) UserQuest ─── (N) Submission
           \___________________/
```

## User Journey
1. User browses `/quests` (list of active quests).
2. User clicks **Start quest** → `POST /api/quests/:id/accept` (creates `UserQuest`).
3. Navigates to `/quests/:id` (detail page).
4. Fills submission form.
5. `POST /api/submissions` (create `Submission` + enqueue Gemini job).
6. Gemini analyzes → returns feedback + XP.
7. `UserQuest` status → `evaluated`, `Submission` stores `xpGain`.
8. User sees results in submission detail or dashboard.
