export interface Quest {
  id: string;
  code: string;
  title: string;
  description: string;
  leanConcept: string;
  story: string;
  objectives: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  xpReward: number;
  timeEstimate: number;
  skillUnlock?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Legacy fields preserved for backwards compatibility
  baseXp?: number;
  briefText?: string | null;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export type LeanConcept =
  | '5S'
  | 'Kaizen'
  | 'ProblemSolving'
  | 'StandardWork'
  | 'Gemba';

export interface UserQuest {
  id: string;
  userId: string;
  questId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  xpEarned?: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}
