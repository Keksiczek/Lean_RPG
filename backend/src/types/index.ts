export interface LeaderboardEntry {
  id: number;
  name: string;
  email: string;
  role: "operator" | "ci" | "admin" | string;
  totalXp: number;
  level: number;
  createdAt: string;
  updatedAt: string;
  rank?: number;
  weeklyXp?: number;
  monthlyXp?: number;
  submissionsCount?: number;
}

export interface PlayerStats {
  submissions: number;
  completedQuests: number;
  concepts: Record<string, number>;
  xpTrend?: { date: string; xp: number }[];
  achievements?: string[];
  recentSubmissions?: {
    id: number;
    questTitle: string;
    status: string;
    xpGain?: number;
    completedAt?: string;
  }[];
}

export interface LeaderboardResponse {
  players: LeaderboardEntry[];
  total: number;
  page: number;
  totalPages: number;
}
