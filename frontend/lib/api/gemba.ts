const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function getAuthToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || '';
}

export type GembaAreaSummary = {
  id: number;
  name: string;
  description: string;
  levelRequired: number;
  color: string;
  position: string;
  npcs: number[];
  problems: number[];
  locked: boolean;
  unlockAtLevel: number;
  activeProblems: number;
  audience?: 'employee' | 'specialist';
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

export type SolutionOption = {
  id: number;
  title: string;
  impact: string;
  feasibility: 'low' | 'medium' | 'high';
  notes: string;
  recommended?: boolean;
};

export type GembaProblem = {
  id: number;
  title: string;
  description: string;
  leanConcept: string;
  areaId: number;
  npcId: number;
  difficulty: string;
  baseXp: number;
  status: string;
  rootCause: string;
  solutions: SolutionOption[];
  questId: number;
};

export type QuestState = {
  questId: number;
  userId: number;
  areaId: number;
  problemId: number;
  npcId: number;
  status: string;
  aiFeedback?: string;
  xpGain?: number;
  conceptGain?: number;
  analysisQuality?: number;
};

export type LeaderboardEntry = {
  userId: number;
  name: string;
  role: 'employee' | 'specialist';
  level: number;
  xp: number;
  team: string;
  badges: number;
  ideasApproved: number;
};

export type LeaderboardSummary = {
  global: LeaderboardEntry[];
  teams: { team: string; score: number; members: number }[];
};

export type DailyChallenge = {
  id: number;
  title: string;
  description: string;
  rewardXp: number;
  rewardPoints: number;
  conceptFocus: string;
};

export type BadgeSummary = {
  id: number;
  name: string;
  description: string;
  icon: string;
  requirement: string;
  xpReward: number;
  pointsReward: number;
  earnedAt?: string;
};

export type IdeaSubmission = {
  id: number;
  title: string;
  problemContext: string;
  proposedSolution: string;
  impact: string;
  status: string;
  submittedAt: string;
};

export async function fetchAreas(): Promise<GembaAreaSummary[]> {
  const response = await fetch(`${API_BASE}/gemba/areas`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to load Gemba areas');
  }

  const data = await response.json();
  return data.areas;
}

export async function fetchAreaDetail(areaId: number): Promise<
  (GembaAreaSummary & { npcs: GembaNpc[]; problems: GembaProblem[] })
> {
  const response = await fetch(`${API_BASE}/gemba/areas/${areaId}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to load area detail');
  }

  return response.json();
}

export async function fetchNpc(npcId: number): Promise<GembaNpc> {
  const response = await fetch(`${API_BASE}/gemba/npcs/${npcId}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to load NPC');
  }

  return response.json();
}

export async function startQuest(questId: number): Promise<QuestState> {
  const response = await fetch(`${API_BASE}/gemba/quests/${questId}/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error('Unable to start quest');
  }

  const data = await response.json();
  return data.state;
}

export async function submitQuest(
  questId: number,
  payload: {
    why1: string;
    why2: string;
    why3: string;
    why4: string;
    why5: string;
    rootCause: string;
    solutionId: number;
  }
): Promise<{ state: QuestState; evaluation: any }> {
  const response = await fetch(`${API_BASE}/gemba/quests/${questId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Quest submission failed');
  }

  return response.json();
}

export async function fetchLeaderboard(): Promise<LeaderboardSummary> {
  const response = await fetch(`${API_BASE}/gemba/leaderboard`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to load leaderboard');
  }

  return response.json();
}

export async function fetchDailyChallenge(): Promise<DailyChallenge> {
  const response = await fetch(`${API_BASE}/gemba/daily-challenge`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to load daily challenge');
  }

  return response.json();
}

export async function fetchBadges(): Promise<{ available: BadgeSummary[]; earned: BadgeSummary[] }> {
  const response = await fetch(`${API_BASE}/gemba/badges`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to load badges');
  }

  return response.json();
}

export async function fetchIdeas(): Promise<IdeaSubmission[]> {
  const response = await fetch(`${API_BASE}/gemba/ideas`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to load ideas');
  }

  const data = await response.json();
  return data.ideas;
}

export async function submitIdea(payload: {
  title: string;
  problemContext: string;
  proposedSolution: string;
  impact: string;
}): Promise<IdeaSubmission> {
  const response = await fetch(`${API_BASE}/gemba/ideas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to submit idea');
  }

  const data = await response.json();
  return data.idea;
}
