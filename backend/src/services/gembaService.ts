import { ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from "../middleware/errors.js";
import prisma from "../lib/prisma.js";
import { evaluateQuestAnswer, QuestEvaluationResult } from "./questEvaluationService.js";

export type LeanConcept = "Muda" | "Mura" | "Muri" | "5S" | "Standard Work" | "Kaizen";

type ProblemStatus = "active" | "solved" | "skipped";

type SolutionOption = {
  id: number;
  title: string;
  impact: string;
  feasibility: "low" | "medium" | "high";
  notes: string;
  recommended?: boolean;
};

export type GembaProblem = {
  id: number;
  title: string;
  description: string;
  leanConcept: LeanConcept;
  areaId: number;
  npcId: number;
  difficulty: "easy" | "medium" | "hard";
  baseXp: number;
  status: ProblemStatus;
  rootCause: string;
  solutions: SolutionOption[];
  questId: number;
};

export type GembaNpc = {
  id: number;
  name: string;
  role: string;
  areaId: number;
  avatar: string;
  personality: string;
  greeting: string;
  problems: number[];
  questsGiven: number;
  level: number;
  dialogue: {
    initial: string;
    accept: string;
    reject: string;
    complete: string;
  };
};

export type GembaArea = {
  id: number;
  name: string;
  description: string;
  levelRequired: number;
  color: string;
  position: string;
  npcs: number[];
  problems: number[];
};

export type QuestAnswer = {
  why1: string;
  why2: string;
  why3: string;
  why4: string;
  why5: string;
  rootCause: string;
  solutionId: number;
};

export type QuestState = {
  questId: number;
  userId: number;
  areaId: number;
  problemId: number;
  npcId: number;
  status: "started" | "analyzing" | "submitted" | "completed" | "failed";
  answer5Why?: Omit<QuestAnswer, "rootCause" | "solutionId">;
  rootCause?: string;
  solutionId?: number;
  aiFeedback?: string;
  xpGain?: number;
  conceptGain?: number;
  analysisQuality?: number;
  startedAt: Date;
  completedAt?: Date;
};

export type UserProgress = {
  level: number;
  totalXp: number;
  role: string;
};

const baselineUnlockedAreas = new Set([1, 2, 3]);

function isAreaUnlocked(area: GembaArea, user: UserProgress) {
  if (baselineUnlockedAreas.has(area.id)) {
    return true;
  }

  const isCiSpecialist = user.role === "ci" || user.role === "admin";

  if (area.id === 5) {
    return isCiSpecialist && user.level >= area.levelRequired;
  }

  return user.level >= area.levelRequired || isCiSpecialist;
}

const gembaAreas: GembaArea[] = [
  {
    id: 1,
    name: "Injection Department",
    description: "Core molding area with cycle-time optimization challenges.",
    levelRequired: 1,
    color: "#2563EB",
    position: "1,3",
    npcs: [1, 2, 3],
    problems: [1, 2, 3],
  },
  {
    id: 2,
    name: "Assembly Line",
    description: "Flow balancing and takt-time stabilization.",
    levelRequired: 3,
    color: "#10B981",
    position: "2,4",
    npcs: [4, 5, 6],
    problems: [4, 5, 6],
  },
  {
    id: 3,
    name: "Painting Booth",
    description: "Surface finishing quality and variation control.",
    levelRequired: 5,
    color: "#FBBF24",
    position: "3,5",
    npcs: [7, 8, 9],
    problems: [7, 8, 9],
  },
  {
    id: 4,
    name: "Warehouse",
    description: "Inventory balance and material flow visibility.",
    levelRequired: 7,
    color: "#92400E",
    position: "4,2",
    npcs: [10, 11, 12],
    problems: [10, 11, 12],
  },
  {
    id: 5,
    name: "Management Office",
    description: "Decision cadence and data accuracy oversight.",
    levelRequired: 10,
    color: "#6B7280",
    position: "2,2",
    npcs: [13, 14, 15],
    problems: [13, 14, 15],
  },
];

const gembaNpcs: GembaNpc[] = [
  {
    id: 1,
    name: "Viktor Müller",
    role: "Factory Manager",
    areaId: 1,
    avatar: "manager-icon.png",
    personality: "stern, focused on efficiency",
    greeting: "Welcome to the injection department. What brings you here?",
    problems: [1, 2, 3],
    questsGiven: 0,
    level: 1,
    dialogue: {
      initial: "Our injection cycle is misaligned with downstream takt time.",
      accept: "Great! Let's solve this together.",
      reject: "No problem. Come back when ready.",
      complete: "Excellent work! You've identified the root cause.",
    },
  },
  {
    id: 2,
    name: "Lea Schmidt",
    role: "Injection Specialist",
    areaId: 1,
    avatar: "specialist.png",
    personality: "curious and pragmatic",
    greeting: "I'm tracking changeovers—can you help reduce the waiting?",
    problems: [1, 2],
    questsGiven: 0,
    level: 1,
    dialogue: {
      initial: "We're seeing overproduction because buffers stay full.",
      accept: "Thanks! Let's analyze the takt mismatch.",
      reject: "Alright, maybe later.",
      complete: "Great Kaizen thinking!",
    },
  },
  {
    id: 3,
    name: "Ravi Kapoor",
    role: "Quality Lead",
    areaId: 1,
    avatar: "quality.png",
    personality: "analytical and calm",
    greeting: "Defects are creeping in after long runs.",
    problems: [3],
    questsGiven: 0,
    level: 1,
    dialogue: {
      initial: "Equipment strain causes downtime spikes.",
      accept: "Let's review the root causes.",
      reject: "Come back when ready.",
      complete: "Much better stability now!",
    },
  },
  {
    id: 4,
    name: "John Lead",
    role: "Assembly Lead",
    areaId: 2,
    avatar: "assembly.png",
    personality: "motivational coach",
    greeting: "Flow is breaking down with WIP pile-ups.",
    problems: [4, 5],
    questsGiven: 0,
    level: 3,
    dialogue: {
      initial: "Can you help smooth takt time?",
      accept: "Awesome, let's align the stations.",
      reject: "I'll ask again soon.",
      complete: "Team notices the improvement!",
    },
  },
  {
    id: 5,
    name: "Sarah Tech",
    role: "Technician",
    areaId: 2,
    avatar: "technician.png",
    personality: "detail oriented",
    greeting: "Manual steps are slowing us down.",
    problems: [5],
    questsGiven: 0,
    level: 3,
    dialogue: {
      initial: "Documentation is outdated—risks rising.",
      accept: "Thanks for stepping in!",
      reject: "Okay, I'll wait.",
      complete: "Standard work feels solid now.",
    },
  },
  {
    id: 6,
    name: "Process Engineer",
    role: "Process Engineer",
    areaId: 2,
    avatar: "process.png",
    personality: "data-driven",
    greeting: "We need a quick line balance review.",
    problems: [4],
    questsGiven: 0,
    level: 3,
    dialogue: {
      initial: "Variation is hurting throughput.",
      accept: "Let's crunch the numbers.",
      reject: "Maybe later then.",
      complete: "Great flow restoration!",
    },
  },
  {
    id: 7,
    name: "Mina Okada",
    role: "Paint Shop Manager",
    areaId: 3,
    avatar: "paint-manager.png",
    personality: "visual perfectionist",
    greeting: "We need to tame paint defects.",
    problems: [7, 8],
    questsGiven: 0,
    level: 5,
    dialogue: {
      initial: "Cycle time variation is rising.",
      accept: "Glad to have you!",
      reject: "Check back later.",
      complete: "Coating quality looks sharp!",
    },
  },
  {
    id: 8,
    name: "Ivan Petrova",
    role: "Quality Inspector",
    areaId: 3,
    avatar: "inspector.png",
    personality: "thorough",
    greeting: "Rework is eating capacity.",
    problems: [8],
    questsGiven: 0,
    level: 5,
    dialogue: {
      initial: "Defects climb during long shifts.",
      accept: "Let's dig in.",
      reject: "Maybe later.",
      complete: "Great catch on variation!",
    },
  },
  {
    id: 9,
    name: "Safety Officer",
    role: "Safety Officer",
    areaId: 3,
    avatar: "safety.png",
    personality: "cautious",
    greeting: "Equipment strain impacts uptime.",
    problems: [9],
    questsGiven: 0,
    level: 5,
    dialogue: {
      initial: "Utilization spikes are risky.",
      accept: "Safety first—let's proceed.",
      reject: "Safety can't wait forever.",
      complete: "Safer cycles now!",
    },
  },
  {
    id: 10,
    name: "Carla Diaz",
    role: "Warehouse Manager",
    areaId: 4,
    avatar: "warehouse.png",
    personality: "organized",
    greeting: "Inventory swings keep me up at night.",
    problems: [10, 11],
    questsGiven: 0,
    level: 7,
    dialogue: {
      initial: "Storage is a maze right now.",
      accept: "Let's create flow.",
      reject: "Okay, later then.",
      complete: "Space finally makes sense!",
    },
  },
  {
    id: 11,
    name: "Logistics Specialist",
    role: "Logistics Specialist",
    areaId: 4,
    avatar: "logistics.png",
    personality: "systematic",
    greeting: "Movement paths are inefficient.",
    problems: [11],
    questsGiven: 0,
    level: 7,
    dialogue: {
      initial: "We need visual lanes.",
      accept: "Let's optimize routes.",
      reject: "I'll wait.",
      complete: "Handlers love the new flow!",
    },
  },
  {
    id: 12,
    name: "Inventory Control",
    role: "Inventory Control",
    areaId: 4,
    avatar: "inventory.png",
    personality: "numbers-driven",
    greeting: "Data accuracy is dropping.",
    problems: [12],
    questsGiven: 0,
    level: 7,
    dialogue: {
      initial: "Stock checks lag behind reality.",
      accept: "Let's create a cadence.",
      reject: "Come back soon.",
      complete: "Accuracy is trending up!",
    },
  },
  {
    id: 13,
    name: "Director",
    role: "Director",
    areaId: 5,
    avatar: "director.png",
    personality: "strategic",
    greeting: "Decisions are stuck in queues.",
    problems: [13],
    questsGiven: 0,
    level: 10,
    dialogue: {
      initial: "We need faster visibility.",
      accept: "Let's streamline.",
      reject: "Understood.",
      complete: "Leadership appreciates the clarity!",
    },
  },
  {
    id: 14,
    name: "Process Improvement Lead",
    role: "Process Improvement Lead",
    areaId: 5,
    avatar: "improvement.png",
    personality: "collaborative",
    greeting: "Standard work for reviews is weak.",
    problems: [14],
    questsGiven: 0,
    level: 10,
    dialogue: {
      initial: "Data accuracy is questionable.",
      accept: "Let's fix the source.",
      reject: "Okay.",
      complete: "Great governance upgrade!",
    },
  },
  {
    id: 15,
    name: "Data Analyst",
    role: "Data Analyst",
    areaId: 5,
    avatar: "data.png",
    personality: "insightful",
    greeting: "Metrics arrive too late for action.",
    problems: [15],
    questsGiven: 0,
    level: 10,
    dialogue: {
      initial: "Reporting cadence misaligns decisions.",
      accept: "Let's align feeds.",
      reject: "Later then.",
      complete: "Decision speed improved!",
    },
  },
];

const gembaProblems: GembaProblem[] = [
  {
    id: 1,
    title: "Waiting time between cycles",
    description: "Parts queue on the conveyor because assembly lags injection.",
    leanConcept: "Muda",
    areaId: 1,
    npcId: 1,
    difficulty: "easy",
    baseXp: 50,
    status: "active",
    rootCause: "Manual quality check bottleneck",
    solutions: [
      {
        id: 1,
        title: "Automate quality check",
        impact: "Improves flow, reduces queue time",
        feasibility: "medium",
        notes: "Leverages inline sensors",
        recommended: true,
      },
      {
        id: 2,
        title: "Adjust takt time",
        impact: "Balances pace with assembly",
        feasibility: "high",
        notes: "Short-term mitigation",
      },
      {
        id: 3,
        title: "Increase buffer size",
        impact: "Masks delay but adds WIP",
        feasibility: "low",
        notes: "Not sustainable",
      },
    ],
    questId: 1,
  },
  {
    id: 2,
    title: "Overproduction risk",
    description: "Injection runs 24/7 causing WIP spikes.",
    leanConcept: "Muda",
    areaId: 1,
    npcId: 2,
    difficulty: "medium",
    baseXp: 60,
    status: "active",
    rootCause: "Schedule ignores downstream takt",
    solutions: [
      {
        id: 4,
        title: "Implement pull signals",
        impact: "Aligns production with demand",
        feasibility: "high",
        notes: "Kanban-style",
        recommended: true,
      },
      {
        id: 5,
        title: "Run overtime",
        impact: "Raises output further",
        feasibility: "low",
        notes: "Worsens WIP",
      },
      {
        id: 6,
        title: "Pause every third cycle",
        impact: "Reduces output in bursts",
        feasibility: "medium",
        notes: "Operationally messy",
      },
    ],
    questId: 2,
  },
  {
    id: 3,
    title: "Equipment downtime spikes",
    description: "Molding press overheats after long shifts.",
    leanConcept: "Muri",
    areaId: 1,
    npcId: 3,
    difficulty: "medium",
    baseXp: 70,
    status: "active",
    rootCause: "No preventive maintenance cadence",
    solutions: [
      {
        id: 7,
        title: "Create PM schedule",
        impact: "Stabilizes uptime",
        feasibility: "high",
        notes: "Quick win",
        recommended: true,
      },
      {
        id: 8,
        title: "Replace chiller",
        impact: "High cost hardware swap",
        feasibility: "medium",
        notes: "Capex heavy",
      },
      {
        id: 9,
        title: "Ignore minor alarms",
        impact: "Short-term throughput gain",
        feasibility: "low",
        notes: "Risks failures",
      },
    ],
    questId: 3,
  },
  {
    id: 4,
    title: "Work-in-progress pile-up",
    description: "Parts wait between stations, blocking flow.",
    leanConcept: "Mura",
    areaId: 2,
    npcId: 4,
    difficulty: "medium",
    baseXp: 75,
    status: "active",
    rootCause: "Unbalanced station rates",
    solutions: [
      {
        id: 10,
        title: "Rebalance line",
        impact: "Aligns station cycle times",
        feasibility: "medium",
        notes: "Requires time study",
        recommended: true,
      },
      {
        id: 11,
        title: "Add large buffer",
        impact: "Masks imbalance",
        feasibility: "low",
        notes: "Increases WIP",
      },
      {
        id: 12,
        title: "Skip quality gate",
        impact: "Faster but riskier",
        feasibility: "low",
        notes: "Quality risk",
      },
    ],
    questId: 4,
  },
  {
    id: 5,
    title: "Inconsistent takt time",
    description: "Operators follow different pacing across shifts.",
    leanConcept: "Mura",
    areaId: 2,
    npcId: 5,
    difficulty: "medium",
    baseXp: 80,
    status: "active",
    rootCause: "Lack of standard work",
    solutions: [
      {
        id: 13,
        title: "Create standard work",
        impact: "Stabilizes pacing",
        feasibility: "high",
        notes: "Include visuals",
        recommended: true,
      },
      {
        id: 14,
        title: "Increase staffing",
        impact: "Helps briefly",
        feasibility: "medium",
        notes: "Costs rise",
      },
      {
        id: 15,
        title: "Cut inspection",
        impact: "Faster but risky",
        feasibility: "low",
        notes: "Quality drops",
      },
    ],
    questId: 5,
  },
  {
    id: 6,
    title: "Manual steps not standardized",
    description: "Assembly depends on tribal knowledge.",
    leanConcept: "Muri",
    areaId: 2,
    npcId: 6,
    difficulty: "easy",
    baseXp: 65,
    status: "active",
    rootCause: "No documented procedures",
    solutions: [
      {
        id: 16,
        title: "Document SOPs",
        impact: "Reduces variation",
        feasibility: "high",
        notes: "Use photos",
        recommended: true,
      },
      {
        id: 17,
        title: "Hire shadow trainers",
        impact: "Improves onboarding",
        feasibility: "medium",
        notes: "Slower deployment",
      },
      {
        id: 18,
        title: "Ignore variations",
        impact: "No change",
        feasibility: "high",
        notes: "Doesn't fix",
      },
    ],
    questId: 6,
  },
  {
    id: 7,
    title: "Cycle time variation",
    description: "Paint booth cycles fluctuate by operator.",
    leanConcept: "Mura",
    areaId: 3,
    npcId: 7,
    difficulty: "medium",
    baseXp: 90,
    status: "active",
    rootCause: "No standardized spray parameters",
    solutions: [
      {
        id: 19,
        title: "Standardize settings",
        impact: "Reduces variation",
        feasibility: "high",
        notes: "Train operators",
        recommended: true,
      },
      {
        id: 20,
        title: "Increase buffer",
        impact: "Masks issues",
        feasibility: "low",
        notes: "Adds WIP",
      },
      {
        id: 21,
        title: "Ignore defects",
        impact: "Short term speed",
        feasibility: "low",
        notes: "Poor quality",
      },
    ],
    questId: 7,
  },
  {
    id: 8,
    title: "Rework due to defects",
    description: "Surface defects require re-spray.",
    leanConcept: "Muda",
    areaId: 3,
    npcId: 8,
    difficulty: "hard",
    baseXp: 110,
    status: "active",
    rootCause: "Unstable prep process",
    solutions: [
      {
        id: 22,
        title: "Add pre-clean checklist",
        impact: "Reduces contamination",
        feasibility: "medium",
        notes: "Standard work",
        recommended: true,
      },
      {
        id: 23,
        title: "Extend cure time",
        impact: "Helps adhesion",
        feasibility: "medium",
        notes: "Slows flow",
      },
      {
        id: 24,
        title: "Increase paint volume",
        impact: "Covers defects temporarily",
        feasibility: "medium",
        notes: "Material waste",
      },
    ],
    questId: 8,
  },
  {
    id: 9,
    title: "Equipment utilization",
    description: "Booth overloaded during rush orders.",
    leanConcept: "Muri",
    areaId: 3,
    npcId: 9,
    difficulty: "medium",
    baseXp: 95,
    status: "active",
    rootCause: "No capacity buffer or SMED",
    solutions: [
      {
        id: 25,
        title: "Introduce SMED",
        impact: "Faster changeovers",
        feasibility: "medium",
        notes: "Requires training",
        recommended: true,
      },
      {
        id: 26,
        title: "Run overtime",
        impact: "Short-term relief",
        feasibility: "high",
        notes: "Fatigue risk",
      },
      {
        id: 27,
        title: "Reject rush orders",
        impact: "Protects capacity",
        feasibility: "medium",
        notes: "Business impact",
      },
    ],
    questId: 9,
  },
  {
    id: 10,
    title: "Inventory imbalance",
    description: "Stockouts alternate with overstock.",
    leanConcept: "Muda",
    areaId: 4,
    npcId: 10,
    difficulty: "medium",
    baseXp: 90,
    status: "active",
    rootCause: "No reorder triggers",
    solutions: [
      {
        id: 28,
        title: "Establish kanban",
        impact: "Balances replenishment",
        feasibility: "high",
        notes: "Visual signals",
        recommended: true,
      },
      {
        id: 29,
        title: "Bulk buy monthly",
        impact: "Creates overstock",
        feasibility: "medium",
        notes: "Cash tied",
      },
      {
        id: 30,
        title: "Expedite orders",
        impact: "Firefighting",
        feasibility: "medium",
        notes: "Costly",
      },
    ],
    questId: 10,
  },
  {
    id: 11,
    title: "Product movement",
    description: "Material travels long distances inside warehouse.",
    leanConcept: "Muda",
    areaId: 4,
    npcId: 11,
    difficulty: "easy",
    baseXp: 70,
    status: "active",
    rootCause: "Layout not optimized",
    solutions: [
      {
        id: 31,
        title: "Define flow lanes",
        impact: "Reduces travel",
        feasibility: "high",
        notes: "Painted visuals",
        recommended: true,
      },
      {
        id: 32,
        title: "Add forklifts",
        impact: "Faster travel",
        feasibility: "medium",
        notes: "Costly and not root cause",
      },
      {
        id: 33,
        title: "Accept current path",
        impact: "No change",
        feasibility: "high",
        notes: "Status quo",
      },
    ],
    questId: 11,
  },
  {
    id: 12,
    title: "Storage space waste",
    description: "Shelves cluttered, accuracy falling.",
    leanConcept: "5S",
    areaId: 4,
    npcId: 12,
    difficulty: "medium",
    baseXp: 85,
    status: "active",
    rootCause: "No 5S cadence",
    solutions: [
      {
        id: 34,
        title: "Launch 5S routine",
        impact: "Cleans and organizes",
        feasibility: "high",
        notes: "Weekly audits",
        recommended: true,
      },
      {
        id: 35,
        title: "Expand warehouse",
        impact: "Adds capacity",
        feasibility: "low",
        notes: "Doesn't fix waste",
      },
      {
        id: 36,
        title: "Temporary tents",
        impact: "Short-term space",
        feasibility: "medium",
        notes: "Weather risk",
      },
    ],
    questId: 12,
  },
  {
    id: 13,
    title: "Process visibility",
    description: "Leaders lack real-time view of floor status.",
    leanConcept: "Muda",
    areaId: 5,
    npcId: 13,
    difficulty: "hard",
    baseXp: 130,
    status: "active",
    rootCause: "No visual management",
    solutions: [
      {
        id: 37,
        title: "Add digital obeya",
        impact: "Centralized visibility",
        feasibility: "medium",
        notes: "Dashboard rollout",
        recommended: true,
      },
      {
        id: 38,
        title: "Weekly reports",
        impact: "Slow feedback",
        feasibility: "high",
        notes: "Lagging",
      },
      {
        id: 39,
        title: "Rely on emails",
        impact: "Low visibility",
        feasibility: "high",
        notes: "Unstructured",
      },
    ],
    questId: 13,
  },
  {
    id: 14,
    title: "Data accuracy",
    description: "KPIs differ across systems.",
    leanConcept: "Mura",
    areaId: 5,
    npcId: 14,
    difficulty: "hard",
    baseXp: 125,
    status: "active",
    rootCause: "No single source of truth",
    solutions: [
      {
        id: 40,
        title: "Create golden dataset",
        impact: "Aligns metrics",
        feasibility: "medium",
        notes: "Requires governance",
        recommended: true,
      },
      {
        id: 41,
        title: "Ignore discrepancies",
        impact: "Confusion persists",
        feasibility: "high",
        notes: "No improvement",
      },
      {
        id: 42,
        title: "Manual reconciliations",
        impact: "Slow and error-prone",
        feasibility: "medium",
        notes: "Band-aid",
      },
    ],
    questId: 14,
  },
  {
    id: 15,
    title: "Decision delays",
    description: "Approvals bottleneck initiatives.",
    leanConcept: "Muri",
    areaId: 5,
    npcId: 15,
    difficulty: "hard",
    baseXp: 140,
    status: "active",
    rootCause: "No clear escalation path",
    solutions: [
      {
        id: 43,
        title: "Define RACI",
        impact: "Clarifies ownership",
        feasibility: "high",
        notes: "Fast to implement",
        recommended: true,
      },
      {
        id: 44,
        title: "Add approval layers",
        impact: "Slows further",
        feasibility: "medium",
        notes: "Opposite effect",
      },
      {
        id: 45,
        title: "Keep ad-hoc",
        impact: "Unpredictable",
        feasibility: "high",
        notes: "Status quo",
      },
    ],
    questId: 15,
  },
];

const questStates = new Map<string, QuestState>();

function questKey(userId: number, questId: number) {
  return `${userId}-${questId}`;
}

export function getAreasForUser(user: UserProgress) {
  return gembaAreas.map((area) => {
    const unlocked = isAreaUnlocked(area, user);

    return {
      ...area,
      locked: !unlocked,
      unlockAtLevel: area.levelRequired,
      activeProblems: area.problems.length,
      audience: area.id === 5 ? "specialist" : "employee",
    };
  });
}

export function getAreaDetail(areaId: number, user: UserProgress) {
  const area = gembaAreas.find((item) => item.id === areaId);
  if (!area) {
    throw new NotFoundError("Area");
  }

  return {
    ...area,
    locked: !isAreaUnlocked(area, user),
    audience: area.id === 5 ? "specialist" : "employee",
    npcs: gembaNpcs.filter((npc) => npc.areaId === areaId),
    problems: gembaProblems.filter((problem) => problem.areaId === areaId),
  };
}

export function getNpcById(npcId: number) {
  const npc = gembaNpcs.find((item) => item.id === npcId);
  if (!npc) {
    throw new NotFoundError("NPC");
  }
  return npc;
}

export function getProblemById(problemId: number) {
  const problem = gembaProblems.find((item) => item.id === problemId);
  if (!problem) {
    throw new NotFoundError("Problem");
  }
  return problem;
}

export function getQuestById(questId: number) {
  const problem = gembaProblems.find((item) => item.questId === questId);
  if (!problem) {
    throw new NotFoundError("Quest");
  }
  return problem;
}

export function getQuestStatus(questId: number, userId: number) {
  const state = questStates.get(questKey(userId, questId));
  if (!state) {
    throw new NotFoundError("Quest status");
  }
  return state;
}

export async function ensureUser(reqUser?: { userId: number }): Promise<{
  id: number;
  level: number;
  totalXp: number;
  role: string;
}> {
  if (!reqUser) {
    throw new UnauthorizedError();
  }

  const user = await prisma.user.findUnique({
    where: { id: reqUser.userId },
    select: { id: true, level: true, totalXp: true, role: true },
  });

  if (!user) {
    throw new UnauthorizedError();
  }

  return user;
}

export function startQuest(questId: number, user: UserProgress & { id: number }) {
  const problem = gembaProblems.find((item) => item.questId === questId);
  if (!problem) {
    throw new NotFoundError("Quest");
  }

  const area = gembaAreas.find((item) => item.id === problem.areaId);
  if (!area) {
    throw new NotFoundError("Area");
  }

  if (!isAreaUnlocked(area, user)) {
    if (area.id === 5) {
      throw new ForbiddenError("Area locked - CI specialist access required");
    }

    throw new ForbiddenError(`Area locked - reach level ${area.levelRequired} or join CI team`);
  }

  const state: QuestState = {
    questId,
    userId: user.id,
    areaId: area.id,
    problemId: problem.id,
    npcId: problem.npcId,
    status: "started",
    startedAt: new Date(),
  };

  questStates.set(questKey(user.id, questId), state);
  return state;
}

export function submitQuestAnswer(
  questId: number,
  user: UserProgress & { id: number },
  payload: QuestAnswer
): { state: QuestState; evaluation: QuestEvaluationResult } {
  const state = questStates.get(questKey(user.id, questId));
  if (!state) {
    throw new ValidationError("Quest not started");
  }

  const problem = getQuestById(questId);
  const evaluation = evaluateQuestAnswer(problem, payload);

  const updated: QuestState = {
    ...state,
    status: "completed",
    answer5Why: {
      why1: payload.why1,
      why2: payload.why2,
      why3: payload.why3,
      why4: payload.why4,
      why5: payload.why5,
    },
    rootCause: payload.rootCause,
    solutionId: payload.solutionId,
    aiFeedback: evaluation.feedback,
    xpGain: evaluation.xpReward,
    conceptGain: evaluation.conceptMasteryGain,
    analysisQuality: evaluation.analysisQuality,
    completedAt: new Date(),
  };

  questStates.set(questKey(user.id, questId), updated);

  return { state: updated, evaluation };
}

export function summarizeQuestProgress(userId: number) {
  const entries = Array.from(questStates.values()).filter((state) => state.userId === userId);
  return entries.map((entry) => ({
    questId: entry.questId,
    status: entry.status,
    xpGain: entry.xpGain ?? 0,
  }));
}

export function getAreaUnlocks() {
  return gembaAreas.map((area) => ({
    areaId: area.id,
    levelRequired: area.levelRequired,
    name: area.name,
  }));
}

export function getNpcDialogWithProblem(npcId: number) {
  const npc = getNpcById(npcId);
  const problems = npc.problems.map((id) => getProblemById(id));
  return {
    ...npc,
    problems,
  };
}
