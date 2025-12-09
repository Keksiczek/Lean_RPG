import Queue, { Job, JobOptions } from "bull";
import redis from "../lib/redis.js";
import { JOB_TYPES, SubmissionAnalysisJob, JobResult } from "../types/jobs.js";
import logger from "../lib/logger.js";
import { config } from "../config.js";

/**
 * Bull Queue Factory
 * Creates and manages job queues
 */

export type SubmissionQueue = Queue<SubmissionAnalysisJob, JobResult>;

let submissionQueue: SubmissionQueue | null = null;

export function getSubmissionQueue(): SubmissionQueue {
  if (submissionQueue) {
    return submissionQueue;
  }

  submissionQueue = new Queue<SubmissionAnalysisJob, JobResult>(
    JOB_TYPES.SUBMISSION_ANALYSIS,
    {
      redis,
      settings: {
        maxStalledCount: 2, // Max times job can be reprocessed
        lockRenewTime: 30_000, // Renew lock every 30s
        lockDuration: 60_000, // Job lock lasts 60s
        maxRetriesPerRequest: null, // Required for Bull
      },
    }
  );

  // Event listeners for monitoring
  submissionQueue.on("active", (job: Job<SubmissionAnalysisJob>) => {
    logger.info({
      message: "job_started",
      jobId: job.id,
      jobType: JOB_TYPES.SUBMISSION_ANALYSIS,
      submissionId: job.data.submissionId,
    });
  });

  submissionQueue.on("completed", (job: Job<SubmissionAnalysisJob>, result: JobResult) => {
    logger.info({
      message: "job_completed",
      jobId: job.id,
      jobType: JOB_TYPES.SUBMISSION_ANALYSIS,
      submissionId: job.data.submissionId,
      xpGain: (result as JobResult | undefined)?.xpGain,
    });
  });

  submissionQueue.on("failed", (job: Job<SubmissionAnalysisJob> | null, error: unknown) => {
    logger.error({
      message: "job_failed",
      jobId: job?.id,
      jobType: JOB_TYPES.SUBMISSION_ANALYSIS,
      submissionId: job?.data.submissionId,
      attempt: job?.attemptsMade,
      error: error instanceof Error ? error.message : String(error),
    });
  });

  submissionQueue.on("error", (error: unknown) => {
    logger.error({
      message: "queue_error",
      error: error instanceof Error ? error.message : String(error),
    });
  });

  return submissionQueue;
}

/**
 * Enqueue a submission analysis job
 */
export async function enqueueSubmissionAnalysis(
  data: SubmissionAnalysisJob,
  options?: Partial<JobOptions>
): Promise<Job<SubmissionAnalysisJob>> {
  const queue = getSubmissionQueue();

  const job = await queue.add(data, {
    attempts: config.queue.submission.maxRetries, // Retry 3 times
    backoff: {
      type: "exponential",
      delay: config.queue.submission.retryDelay, // Start with 2s
    },
    removeOnComplete: false, // Keep completed jobs for history
    removeOnFail: false, // Keep failed jobs for debugging
    priority: 1, // Default priority (higher = processed first)
    timeout: config.queue.submission.jobTimeout, // Job timeout: 120s
    ...options,
  });

  logger.info({
    message: "job_enqueued",
    jobId: job.id,
    submissionId: data.submissionId,
    jobType: JOB_TYPES.SUBMISSION_ANALYSIS,
  });

  return job;
}

/**
 * Get queue stats
 */
export async function getQueueStats() {
  const queue = getSubmissionQueue();

  const counts = await queue.getJobCounts();
  const waiting = await queue.getWaitingCount();
  const active = await queue.getActiveCount();
  const completed = await queue.getCompletedCount();
  const failed = await queue.getFailedCount();

  return {
    queue: JOB_TYPES.SUBMISSION_ANALYSIS,
    counts,
    summary: {
      waiting,
      active,
      completed,
      failed,
    },
  };
}

/**
 * Close queue connection
 */
export async function closeQueue(): Promise<void> {
  if (submissionQueue) {
    await submissionQueue.close();
    submissionQueue = null;
  }
}
