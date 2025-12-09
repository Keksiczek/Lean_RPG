import type { Quest } from "./quest";

export type Submission = {
  id: number;
  userId: number;
  questId: number;
  content: string;
  status: "submitted" | "pending_analysis" | "evaluated" | "failed";
  aiFeedback?: string | null;
  xpGain?: number | null;
  createdAt: Date;
  quest: Quest;
};
