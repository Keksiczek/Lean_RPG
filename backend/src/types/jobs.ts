/**
 * Job types and interfaces for Bull queue
 */

export interface SubmissionAnalysisJob {
  submissionId: number;
  requestId?: string;
  userId: number;
  questId: number;
  metadata?: {
    retryCount?: number;
    enqueuedAt?: string;
  };
}

export interface JobProgress {
  status: "queued" | "analyzing" | "updating" | "completed" | "failed";
  progress: number; // 0-100
  message: string;
  timestamp: string;
}

export interface JobResult {
  success: boolean;
  submissionId: number;
  xpGain?: number;
  feedback?: string;
  error?: string;
}

export type JobType = "submission_analysis";

export const JOB_TYPES = {
  SUBMISSION_ANALYSIS: "submission_analysis" as const,
} as const;
