'use client';

import { useQuery } from '@tanstack/react-query';
import { Quest } from '@/types/quest';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export function useQuests() {
  return useQuery({
    queryKey: ['quests'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/quests`);
      if (!response.ok) {
        throw new Error('Failed to fetch quests');
      }
      return response.json() as Promise<Quest[]>;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useQuestById(questId: string) {
  return useQuery({
    queryKey: ['quests', questId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/quests/${questId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch quest');
      }
      return response.json() as Promise<Quest>;
    },
    enabled: !!questId,
  });
}
