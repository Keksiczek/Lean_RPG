export interface Quest {
  id: string;
  code: string;
  title: string;
  description: string;
  leanConcept: string;
  story: string;
  objectives: string[];
  difficulty: "easy" | "medium" | "hard";
  xpReward: number;
  timeEstimate: number;
  skillUnlock?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserQuestProgress {
  id: string;
  userId: string;
  questId: string;
  status: "not_started" | "in_progress" | "completed";
  xpEarned: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestWithProgress extends Quest {
  userProgress?: UserQuestProgress;
}
