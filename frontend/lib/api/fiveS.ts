const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function getAuthToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || '';
}

export type FiveSQuestion = { id: number; question: string; hint?: string; points?: number };

export type FiveSSetting = {
  id: number;
  name: string;
  areaId: number;
  timeLimit: number;
  maxProblems: number;
  maxScore: number;
  passingScore: number;
  sortCriteria: FiveSQuestion[];
  orderCriteria: FiveSQuestion[];
  shineCriteria: FiveSQuestion[];
  standardizeCriteria: FiveSQuestion[];
  sustainCriteria: FiveSQuestion[];
};

export type FiveSProblem = {
  id?: number;
  position: string;
  description: string;
  screenshot?: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
};

export type FiveSAudit = {
  id: number;
  areaId: number;
  settingId: number;
  status: string;
  sortScore?: number | null;
  orderScore?: number | null;
  shineScore?: number | null;
  standardizeScore?: number | null;
  sustainScore?: number | null;
  totalScore?: number | null;
  problemsFound?: FiveSProblem[];
  aiFeedback?: string | null;
  mainIssue?: string | null;
  xpGain: number;
  pointsGain: number;
  badgeEarned?: string | null;
  completedAt?: string | null;
  timeSpent?: number | null;
  setting?: FiveSSetting;
  problems?: FiveSProblem[];
};

export async function fetchFiveSSetting(areaId: number): Promise<FiveSSetting> {
  const response = await fetch(`${API_BASE}/5s/settings/${areaId}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to load 5S setting');
  }

  return response.json();
}

export async function startFiveSAudit(areaId: number) {
  const response = await fetch(`${API_BASE}/5s/audits`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify({ areaId }),
  });

  if (!response.ok) {
    throw new Error('Failed to start audit');
  }

  const data = await response.json();
  return data.audit as FiveSAudit;
}

export async function fetchAudit(auditId: number): Promise<FiveSAudit> {
  const response = await fetch(`${API_BASE}/5s/audits/${auditId}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to load audit');
  }

  return response.json();
}

export async function submitFiveSAudit(auditId: number, payload: {
  answers: Record<string, { value: string }[]>;
  problems: FiveSProblem[];
  timeSpent?: number;
}): Promise<FiveSAudit> {
  const response = await fetch(`${API_BASE}/5s/audits/${auditId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to submit audit');
  }

  return response.json();
}

export async function fetchAuditHistory(userId: number) {
  const response = await fetch(`${API_BASE}/5s/audits/user/${userId}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to load history');
  }

  return response.json();
}

export async function fetchFiveSLeaderboard() {
  const response = await fetch(`${API_BASE}/5s/leaderboard`, {
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

export async function addProblemToAudit(auditId: number, problem: FiveSProblem) {
  const response = await fetch(`${API_BASE}/5s/audits/${auditId}/problem`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(problem),
  });

  if (!response.ok) {
    throw new Error('Failed to add problem');
  }

  return response.json();
}
