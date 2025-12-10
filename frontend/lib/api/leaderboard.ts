import type { LeaderboardEntry } from '@/types/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function getAuthToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || '';
}

interface FetchLeaderboardFilters {
  timeframe?: 'all' | 'week' | 'month';
  page?: number;
  search?: string;
  limit?: number;
}

interface LeaderboardResponse {
  players: LeaderboardEntry[];
  total: number;
  page: number;
}

export async function fetchLeaderboard(filters?: FetchLeaderboardFilters): Promise<LeaderboardResponse> {
  const params = new URLSearchParams();
  if (filters?.timeframe) params.append('timeframe', filters.timeframe);
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.search) params.append('search', filters.search);
  if (filters?.limit) params.append('limit', String(filters.limit));

  const response = await fetch(`${API_BASE}/leaderboard?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch leaderboard');
  }

  return response.json();
}
