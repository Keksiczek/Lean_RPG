import api from './api';

export type Quest = {
  id: number;
  title: string;
  description: string;
  baseXp: number;
  difficulty: 'easy' | 'medium' | 'hard';
  leanConcept?: string;
};

/**
 * Načti všechny dostupné questy z backendu
 */
export async function fetchQuests(): Promise<Quest[]> {
  const response = await api.get('/api/quests');
  return response.data;
}

/**
 * Vrátí barvu pro difficulty badge
 */
export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'easy':
      return 'bg-green-100 text-green-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'hard':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
