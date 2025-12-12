# 📚 Lean_RPG API Specification

**Version:** 0.1.0  
**Status:** ✅ Production-Ready  
**Last Updated:** 12. prosince 2025

---

## 📋 Obsah

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Public Endpoints](#public-endpoints)
5. [Protected Endpoints](#protected-endpoints)
6. [Error Codes](#error-codes)
7. [Rate Limiting](#rate-limiting)
8. [Examples](#examples)

---

## Overview

### Base URL

```
https://api.lean-rpg.com/api
```

During local development:
```
http://localhost:4000/api
```

### API Version

Current version: `0.1.0` (not versioned in URL yet)

### Response Times

- Average: **50-200ms**
- P95: **500ms**
- P99: **1s**

---

## Authentication

### JWT Authentication

Všechny protected endpoints vyžadují JWT token v Authorization headeru:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Lifecycle

1. **Register/Login** - Obdržíš JWT token (7 dní validita)
2. **Include in Request** - Přidej do Authorization header
3. **Token Expiration** - Login znovu po vypršení

### JWT Payload

```json
{
  "userId": "user-uuid",
  "email": "player@example.com",
  "role": "player",
  "tenantId": "tenant-uuid",
  "iat": 1702396800,
  "exp": 1703001600
}
```

---

## Response Format

### Success Response (200, 201, 202)

```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "player@example.com",
    "level": 5,
    "totalXp": 2500
  },
  "timestamp": "2025-12-12T10:00:00Z"
}
```

### Error Response (4xx, 5xx)

```json
{
  "success": false,
  "error": "Invalid quest ID",
  "code": "QUEST_NOT_FOUND",
  "statusCode": 404,
  "timestamp": "2025-12-12T10:00:01Z"
}
```

### Pagination Response

```json
{
  "success": true,
  "data": [
    { "id": "1", "title": "Quest 1" },
    { "id": "2", "title": "Quest 2" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3,
    "hasMore": true
  },
  "timestamp": "2025-12-12T10:00:00Z"
}
```

---

## Public Endpoints

### Authentication

#### Register New Player

```http
POST /auth/register
Content-Type: application/json

{
  "email": "player@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "company": "Toyota"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "player@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 604800
  },
  "timestamp": "2025-12-12T10:00:00Z"
}
```

**Errors:**
- `400` - Email already exists
- `400` - Password too weak
- `400` - Missing required fields

---

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "player@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "player@example.com",
    "firstName": "John",
    "level": 5,
    "totalXp": 2500,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 604800
  },
  "timestamp": "2025-12-12T10:00:00Z"
}
```

**Errors:**
- `401` - Invalid credentials
- `404` - User not found

---

#### Health Check

```http
GET /health
```

**Response (200):**
```json
{
  "status": "ok",
  "uptime": 3600,
  "timestamp": "2025-12-12T10:00:00Z"
}
```

---

## Protected Endpoints

**Vyžaduje:** `Authorization: Bearer {token}` header

### Quests

#### Get All Quests

```http
GET /quests?page=1&limit=20&difficulty=MEDIUM&leanConcept=5S
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20, max: 100) - Items per page
- `difficulty` (string) - Filter: EASY, MEDIUM, HARD
- `leanConcept` (string) - Filter: 5S, MUDA, KAIZEN, etc.
- `areaId` (uuid) - Filter by area
- `status` (string) - Filter: NOT_STARTED, IN_PROGRESS, COMPLETED

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "quest-uuid",
      "title": "Organize the warehouse",
      "description": "Learn 5S methodology",
      "leanConcept": "5S",
      "difficulty": "EASY",
      "xpReward": 100,
      "estimatedTime": 15,
      "area": {
        "id": "area-uuid",
        "name": "Warehouse"
      },
      "status": "NOT_STARTED",
      "createdAt": "2025-12-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3,
    "hasMore": true
  },
  "timestamp": "2025-12-12T10:00:00Z"
}
```

---

#### Get Quest Details

```http
GET /quests/{questId}
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "quest-uuid",
    "title": "Organize the warehouse",
    "description": "Learn 5S methodology by organizing a messy warehouse area",
    "story": "Your warehouse manager reports...",
    "leanConcept": "5S",
    "difficulty": "EASY",
    "xpReward": 100,
    "skillUnlock": "SORT_SKILL",
    "estimatedTime": 15,
    "objectives": [
      "Identify 5S categories",
      "Sort items by type",
      "Create action plan"
    ],
    "requirements": {
      "minLevel": 1,
      "requiredSkills": []
    },
    "area": {
      "id": "area-uuid",
      "name": "Warehouse",
      "description": "Main storage facility"
    },
    "rewards": {
      "xp": 100,
      "badges": ["ORGANIZER"],
      "skillProgression": {"SORT_SKILL": 10}
    },
    "status": "NOT_STARTED",
    "startedAt": null,
    "completedAt": null,
    "createdAt": "2025-12-01T10:00:00Z"
  },
  "timestamp": "2025-12-12T10:00:00Z"
}
```

**Errors:**
- `404` - Quest not found
- `403` - Access denied (doesn't meet requirements)

---

#### Start Quest

```http
POST /quests/{questId}/start
Authorization: Bearer {token}
Content-Type: application/json

{}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "questId": "quest-uuid",
    "status": "IN_PROGRESS",
    "startedAt": "2025-12-12T10:00:00Z",
    "timeLimit": 900
  },
  "timestamp": "2025-12-12T10:00:00Z"
}
```

**Errors:**
- `404` - Quest not found
- `409` - Quest already started
- `403` - Requirements not met

---

### Submissions (Solutions)

#### Submit Solution

```http
POST /submissions
Authorization: Bearer {token}
Content-Type: application/json

{
  "questId": "quest-uuid",
  "content": "My solution text or JSON data",
  "attachments": ["image-url-1", "image-url-2"]
}
```

**Response (202):** (Accepted for processing)
```json
{
  "success": true,
  "data": {
    "submissionId": "submission-uuid",
    "questId": "quest-uuid",
    "status": "PENDING",
    "submittedAt": "2025-12-12T10:00:00Z",
    "processingStatus": "QUEUED",
    "estimatedProcessingTime": 30
  },
  "timestamp": "2025-12-12T10:00:00Z"
}
```

**Errors:**
- `404` - Quest not found
- `409` - Quest not started
- `429` - Rate limited (5 submissions/min)
- `400` - Validation failed

---

#### Get Submission Status

```http
GET /submissions/{submissionId}
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "submissionId": "submission-uuid",
    "questId": "quest-uuid",
    "userId": "user-uuid",
    "status": "COMPLETED",
    "content": "My solution...",
    "submittedAt": "2025-12-12T10:00:00Z",
    "evaluatedAt": "2025-12-12T10:00:30Z",
    "feedback": {
      "quality": "GOOD",
      "score": 85,
      "aiFeedback": "Your solution correctly identifies the root cause...",
      "suggestions": ["Consider the impact on...", "Alternative approach..."],
      "categoryFeedback": {
        "PEOPLE": {"score": 90, "feedback": "Excellent people analysis"},
        "PROCESS": {"score": 80, "feedback": "Good process identification"}
      }
    },
    "rewards": {
      "xpGained": 100,
      "badgeEarned": "PROBLEM_SOLVER",
      "skillProgress": {"PROBLEM_SOLVING": 15}
    }
  },
  "timestamp": "2025-12-12T10:00:00Z"
}
```

**Errors:**
- `404` - Submission not found
- `403` - Access denied (not owner)

---

#### Get My Submissions

```http
GET /submissions?page=1&limit=10&questId={questId}&status=COMPLETED
Authorization: Bearer {token}
```

**Rate Limited:** 5 requests per minute

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "submissionId": "submission-uuid",
      "questId": "quest-uuid",
      "questTitle": "Organize the warehouse",
      "status": "COMPLETED",
      "score": 85,
      "submittedAt": "2025-12-12T10:00:00Z",
      "evaluatedAt": "2025-12-12T10:00:30Z"
    }
  ],
  "pagination": {"page": 1, "limit": 10, "total": 5},
  "timestamp": "2025-12-12T10:00:00Z"
}
```

---

### Users & Progression

#### Get My Profile

```http
GET /users/me
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "user-uuid",
    "email": "player@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "company": "Toyota",
    "profileImage": "https://...",
    "level": 5,
    "totalXp": 2500,
    "nextLevelXp": 3000,
    "tier": "BRONZE",
    "joinedAt": "2025-11-01T10:00:00Z",
    "lastActivityAt": "2025-12-12T09:00:00Z",
    "stats": {
      "questsCompleted": 12,
      "badgesEarned": 5,
      "totalPlayTime": 3600,
      "currentStreak": 5
    }
  },
  "timestamp": "2025-12-12T10:00:00Z"
}
```

---

#### Get My Progression

```http
GET /progression
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "level": 5,
    "totalXp": 2500,
    "xpToNextLevel": 500,
    "nextLevelXp": 3000,
    "tier": "BRONZE",
    "tierProgress": 60,
    "skillTree": {
      "unlockedCount": 8,
      "totalCount": 25,
      "progress": 32
    },
    "questsProgress": {
      "completed": 12,
      "inProgress": 2,
      "available": 30
    },
    "badges": {
      "earned": 5,
      "total": 20
    },
    "achievements": {
      "unlocked": 3,
      "total": 15
    },
    "recentActivities": [
      {
        "type": "QUEST_COMPLETED",
        "title": "Organize the warehouse",
        "xpGained": 100,
        "timestamp": "2025-12-12T08:00:00Z"
      }
    ]
  },
  "timestamp": "2025-12-12T10:00:00Z"
}
```

---

### 5S Audits

#### Start 5S Audit

```http
POST /5s/audit/start
Authorization: Bearer {token}
Content-Type: application/json

{
  "areaId": "area-uuid",
  "templateId": "template-uuid"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "auditId": "audit-uuid",
    "areaId": "area-uuid",
    "status": "IN_PROGRESS",
    "startedAt": "2025-12-12T10:00:00Z",
    "categories": [
      {
        "name": "SORT",
        "description": "Remove unnecessary items",
        "items": [
          {
            "id": "item-1",
            "question": "Are there unnecessary items in the area?",
            "score": null
          }
        ]
      }
    ],
    "timeLimit": 1800
  },
  "timestamp": "2025-12-12T10:00:00Z"
}
```

---

#### Submit 5S Audit

```http
POST /5s/audit/{auditId}/submit
Authorization: Bearer {token}
Content-Type: application/json

{
  "results": {
    "SORT": {
      "score": 85,
      "problems": ["Found 15 old boxes"],
      "evidenceImages": ["image-url"]
    },
    "ORDER": {
      "score": 70,
      "problems": ["Tools not labeled"],
      "evidenceImages": []
    },
    "SHINE": {
      "score": 90,
      "problems": [],
      "evidenceImages": []
    },
    "STANDARDIZE": {
      "score": 60,
      "problems": ["No standard procedures"],
      "evidenceImages": []
    },
    "SUSTAIN": {
      "score": 75,
      "problems": ["Need training"],
      "evidenceImages": []
    }
  },
  "notes": "Overall assessment and observations"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "auditId": "audit-uuid",
    "status": "COMPLETED",
    "submittedAt": "2025-12-12T10:05:00Z",
    "scores": {
      "SORT": 85,
      "ORDER": 70,
      "SHINE": 90,
      "STANDARDIZE": 60,
      "SUSTAIN": 75,
      "OVERALL": 76
    },
    "problemsFound": 4,
    "aiFeedback": "Good effort on cleanliness...",
    "recommendations": [
      "Implement labeling system",
      "Create 5S maintenance schedule",
      "Train staff on standards"
    ],
    "rewards": {
      "xpGained": 150,
      "badgeEarned": "5S_AUDITOR"
    }
  },
  "timestamp": "2025-12-12T10:05:00Z"
}
```

---

### Problem Solving (Ishikawa)

#### Start Problem Analysis

```http
POST /problem-solving/{challengeId}/start
Authorization: Bearer {token}
Content-Type: application/json

{
  "problemStatement": "Production line is slower than expected"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "analysisId": "analysis-uuid",
    "challengeId": "challenge-uuid",
    "problemStatement": "Production line is slower than expected",
    "status": "IN_PROGRESS",
    "startedAt": "2025-12-12T10:00:00Z",
    "categories": [
      {"id": "PEOPLE", "name": "People"},
      {"id": "PROCESS", "name": "Process"},
      {"id": "MATERIAL", "name": "Material"},
      {"id": "MACHINE", "name": "Machine"},
      {"id": "MEASUREMENT", "name": "Measurement"},
      {"id": "ENVIRONMENT", "name": "Environment"}
    ],
    "timeLimit": 1200
  },
  "timestamp": "2025-12-12T10:00:00Z"
}
```

---

#### Submit Problem Analysis

```http
POST /problem-solving/{analysisId}/submit
Authorization: Bearer {token}
Content-Type: application/json

{
  "analysis": {
    "PEOPLE": ["Inadequate training", "Staff shortage"],
    "PROCESS": ["Inefficient workflow"],
    "MATERIAL": [],
    "MACHINE": ["Equipment maintenance needed"],
    "MEASUREMENT": ["No monitoring system"],
    "ENVIRONMENT": []
  },
  "rootCause": "Equipment maintenance needed - specific machine needs calibration",
  "proposedSolution": "Schedule maintenance and implement preventive checks",
  "expectedImpact": "20% productivity improvement"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "analysisId": "analysis-uuid",
    "status": "COMPLETED",
    "evaluatedAt": "2025-12-12T10:15:00Z",
    "solutionQuality": "EXCELLENT",
    "score": 92,
    "feedback": {
      "overall": "Excellent problem analysis with well-identified root cause...",
      "strengths": ["Thorough analysis", "Realistic solution"],
      "improvements": ["Could quantify impact better"]
    },
    "categoryFeedback": {
      "PEOPLE": {"score": 85, "feedback": "Good identification of training gaps"},
      "PROCESS": {"score": 90, "feedback": "Excellent process analysis"}
    },
    "rewards": {
      "xpGained": 200,
      "badgeEarned": "ROOT_CAUSE_MASTER",
      "skillProgress": {"PROBLEM_SOLVING": 20}
    }
  },
  "timestamp": "2025-12-12T10:15:00Z"
}
```

---

### Skills & Skill Tree

#### Get My Skills

```http
GET /skills?tier=1&category=5S
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "skillId": "skill-uuid",
      "name": "SORT_SKILL",
      "displayName": "Sorting Master",
      "description": "Ability to identify and remove unnecessary items",
      "category": "5S",
      "tier": 1,
      "level": 2,
      "progress": 65,
      "isUnlocked": true,
      "masteryLevel": "INTERMEDIATE",
      "prerequisites": [],
      "nextLevel": {"requiredXp": 35}
    }
  ],
  "timestamp": "2025-12-12T10:00:00Z"
}
```

---

#### Get Skill Tree

```http
GET /skills/tree
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "skillId": "skill-uuid",
        "name": "SORT_SKILL",
        "tier": 1,
        "x": 100,
        "y": 50,
        "isUnlocked": true,
        "canUnlock": true,
        "requirements": {
          "minLevel": 1,
          "minXp": 0,
          "requiresSkills": []
        },
        "unlockCost": {"xp": 50}
      }
    ],
    "connections": [
      {"from": "skill-1", "to": "skill-2", "type": "PREREQUISITE"}
    ]
  },
  "timestamp": "2025-12-12T10:00:00Z"
}
```

---

#### Unlock Skill

```http
POST /skills/{skillId}/unlock
Authorization: Bearer {token}
Content-Type: application/json

{}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "skillId": "skill-uuid",
    "isUnlocked": true,
    "unlockedAt": "2025-12-12T10:00:00Z",
    "currentXp": 2350,
    "levelUp": false
  },
  "timestamp": "2025-12-12T10:00:00Z"
}
```

---

### Gamification

#### Get My Badges

```http
GET /gamification/badges
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "earned": [
      {
        "badgeId": "badge-uuid",
        "name": "ORGANIZER",
        "displayName": "The Organizer",
        "description": "Complete your first 5S audit",
        "icon": "https://...",
        "earnedAt": "2025-12-01T10:00:00Z",
        "rarity": "COMMON",
        "points": 10
      }
    ],
    "available": [
      {
        "badgeId": "badge-uuid-2",
        "name": "5S_MASTER",
        "displayName": "5S Master",
        "description": "Complete 10 5S audits with score > 80",
        "icon": "https://...",
        "progress": 3,
        "required": 10,
        "rarity": "RARE"
      }
    ],
    "stats": {
      "totalEarned": 5,
      "totalAvailable": 20,
      "totalPoints": 50
    }
  },
  "timestamp": "2025-12-12T10:00:00Z"
}
```

---

#### Get Leaderboard

```http
GET /gamification/leaderboard?limit=10&period=ALL_TIME
Authorization: Bearer {token}
```

**Query Parameters:**
- `limit` (number, default: 10, max: 100)
- `period` (string) - WEEKLY, MONTHLY, ALL_TIME
- `tier` (string) - Filter by tier

**Response (200):**
```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "rank": 1,
        "userId": "user-uuid",
        "firstName": "John",
        "level": 15,
        "totalXp": 45000,
        "badgesEarned": 18,
        "tier": "GOLD",
        "isCurrentUser": false
      }
    ],
    "currentUserRank": {
      "rank": 42,
      "totalXp": 2500,
      "percentile": 75
    }
  },
  "timestamp": "2025-12-12T10:00:00Z"
}
```

---

## Error Codes

### Authentication Errors (401)

| Code | Message | Solution |
|------|---------|----------|
| `INVALID_TOKEN` | JWT token is invalid or expired | Login again to get new token |
| `MISSING_TOKEN` | Authorization header is missing | Add `Authorization: Bearer {token}` |
| `TOKEN_EXPIRED` | Token has expired | Refresh token or login again |
| `INVALID_CREDENTIALS` | Email or password incorrect | Check credentials |

### Validation Errors (400)

| Code | Message | Solution |
|------|---------|----------|
| `VALIDATION_ERROR` | Input validation failed | Check request format |
| `MISSING_REQUIRED_FIELD` | Required field missing | Include all required fields |
| `INVALID_QUEST_STATUS` | Quest is not in valid state | Check quest status |
| `REQUIREMENTS_NOT_MET` | Level/skill requirements not met | Unlock prerequisites |

### Resource Errors (404)

| Code | Message | Solution |
|------|---------|----------|
| `QUEST_NOT_FOUND` | Quest doesn't exist | Check quest ID |
| `USER_NOT_FOUND` | User doesn't exist | Check user ID |
| `SUBMISSION_NOT_FOUND` | Submission doesn't exist | Check submission ID |
| `SKILL_NOT_FOUND` | Skill doesn't exist | Check skill ID |

### Rate Limiting (429)

| Code | Message | Solution |
|------|---------|----------|
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait before retrying |
| `SUBMISSION_RATE_LIMIT` | 5 submissions per minute | Space out submissions |

### Server Errors (500)

| Code | Message | Solution |
|------|---------|----------|
| `INTERNAL_SERVER_ERROR` | Something went wrong | Retry after delay, check status page |
| `DATABASE_ERROR` | Database connection failed | Retry, contact support if persists |
| `AI_SERVICE_ERROR` | AI feedback service unavailable | Feedback will be processed later |

---

## Rate Limiting

### Global Rate Limit

- **Limit:** 100 requests per minute per IP
- **Header:** `X-RateLimit-Limit: 100`
- **Remaining:** `X-RateLimit-Remaining: 95`
- **Reset:** `X-RateLimit-Reset: 1702398360`

### Endpoint-Specific Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /submissions` | 5 req | Per minute |
| `GET /submissions` | 5 req | Per minute |
| All others | 100 req | Per minute |

### Error Response (429)

```json
{
  "success": false,
  "error": "Too many requests",
  "code": "RATE_LIMIT_EXCEEDED",
  "statusCode": 429,
  "retryAfter": 60,
  "timestamp": "2025-12-12T10:00:00Z"
}
```

---

## Examples

### Complete Quest Flow

```bash
# 1. Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "player@example.com", "password": "password"}'

# Store token from response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 2. Get available quests
curl http://localhost:4000/api/quests \
  -H "Authorization: Bearer $TOKEN"

# 3. Start quest
curl -X POST http://localhost:4000/api/quests/{questId}/start \
  -H "Authorization: Bearer $TOKEN"

# 4. Submit solution
curl -X POST http://localhost:4000/api/submissions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"questId": "quest-uuid", "content": "My solution..."}'

# 5. Check submission status (poll every 2 seconds)
curl http://localhost:4000/api/submissions/{submissionId} \
  -H "Authorization: Bearer $TOKEN"
```

### Error Handling Example

```bash
# Missing token
curl http://localhost:4000/api/quests
# Response: 401 MISSING_TOKEN

# Invalid quest
curl http://localhost:4000/api/quests/invalid-id \
  -H "Authorization: Bearer $TOKEN"
# Response: 404 QUEST_NOT_FOUND

# Too many submissions
for i in {1..10}; do
  curl -X POST http://localhost:4000/api/submissions \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"questId": "q", "content": "x"}'
done
# After 5: 429 RATE_LIMIT_EXCEEDED
```

---

## Changelog

### v0.1.0 - 2025-12-12
- Initial API specification
- 25+ endpoints documented
- Complete authentication flow
- Error codes and examples

---

**Questions? Check the main README.md or GitHub issues.**
