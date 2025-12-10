import type { PlayerStats, User } from '@/types/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function getAuthToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || '';
}

export async function fetchPlayer(userId: number): Promise<User | null> {
  const response = await fetch(`${API_BASE}/players/${userId}`, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
    cache: 'no-store',
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to fetch player');
  }

  return response.json();
}

export async function fetchPlayerStats(userId: number): Promise<PlayerStats> {
  const response = await fetch(`${API_BASE}/players/${userId}/stats`, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch player stats');
  }

  return response.json();
}
