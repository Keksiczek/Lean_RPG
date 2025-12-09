export type Quest = {
  id: number;
  title: string;
  description: string;
  baseXp: number;
  briefText?: string | null;
  leanConcept?: string | null;
  isActive: boolean;
};

export type UserQuest = {
  id: number;
  userId: number;
  questId: number;
  status: "not_started" | "in_progress" | "evaluated" | "completed" | "abandoned";
  acceptedAt?: Date;
  completedAt?: Date;
};
