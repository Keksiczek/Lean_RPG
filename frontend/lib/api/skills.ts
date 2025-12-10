import type { PlayerSkill, SkillProgression, SkillTreeNode } from '@/types/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function getAuthToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || '';
}

function authHeaders() {
  return {
    Authorization: `Bearer ${getAuthToken()}`,
  };
}

export async function fetchSkillTree(): Promise<SkillTreeNode[]> {
  const response = await fetch(`${API_BASE}/skills/tree`, {
    headers: authHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch skill tree');
  }

  return response.json();
}

export async function fetchMySkills(): Promise<{ progression: SkillProgression; skills: PlayerSkill[] }> {
  const response = await fetch(`${API_BASE}/skills/my-skills`, {
    headers: authHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch skills');
  }

  return response.json();
}

export async function fetchProgressionDashboard(): Promise<SkillProgression> {
  const response = await fetch(`${API_BASE}/progression/dashboard`, {
    headers: authHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch progression');
  }

  return response.json();
}

export async function activateSkill(skillId: number) {
  const response = await fetch(`${API_BASE}/skills/${skillId}/activate`, {
    method: 'PATCH',
    headers: authHeaders(),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to activate skill');
  }
}

export async function deactivateSkill(skillId: number) {
  const response = await fetch(`${API_BASE}/skills/${skillId}/deactivate`, {
    method: 'POST',
    headers: authHeaders(),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to deactivate skill');
  }
}
