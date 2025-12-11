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

export type SubmissionBadge = {
  id: string | number;
  name: string;
  icon: string;
};

export type SubmissionFeedback = {
  score: number;
  feedback: string;
  improvements?: string[];
  xpEarned: number;
  badgesUnlocked?: SubmissionBadge[];
};
