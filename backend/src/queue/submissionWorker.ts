import Queue, { Job } from "bull";
import { SubmissionAnalysisJob, JobResult } from "../types/jobs.js";
import { geminiService } from "../services/GeminiService.js";
import { getSubmissionQueue } from "./queueFactory.js";
import logger from "../lib/logger.js";
import prisma from "../lib/prisma.js";
import { config } from "../config.js";

/**
 * Job Worker for submission analysis
 * Processes jobs from the queue
 */

export async function startSubmissionWorker() {
  const queue = getSubmissionQueue();

  // Define the job processor
  await queue.process(config.queue.submission.maxConcurrency, async (job: Job<SubmissionAnalysisJob>) => {
    const { submissionId, requestId } = job.data;

    logger.info({
      message: "worker_processing_job",
      jobId: job.id,
      submissionId,
      requestId,
      attempt: job.attemptsMade + 1,
    });

    try {
      // Report progress
      await job.progress(25);

      // Verify submission still exists
      const submission = await (prisma as any).submission.findUnique({
        where: { id: submissionId },
      });

      if (!submission) {
        throw new Error(`Submission #${submissionId} not found`);
      }

      await job.progress(50);

      // Process submission with Gemini
      // NOTE: geminiService.processSubmission handles all the Gemini logic,
      // retry, fallback, XP updates, etc.
      await geminiService.processSubmission({
        submissionId,
        requestId,
      });

      await job.progress(100);

      // Fetch updated submission for return data
      const updated = await (prisma as any).submission.findUnique({
        where: { id: submissionId },
      });

      const result: JobResult = {
        success: true,
        submissionId,
        xpGain: updated?.xpGain ?? 0,
        feedback: updated?.aiFeedback ?? "Analysis complete",
      };

      logger.info({
        message: "worker_job_success",
        jobId: job.id,
        submissionId,
        xpGain: result.xpGain,
      });

      return result;
    } catch (error) {
      logger.error({
        message: "worker_job_error",
        jobId: job.id,
        submissionId,
        requestId,
        attempt: job.attemptsMade + 1,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Throw to let Bull handle retry
      throw error;
    }
  });

  logger.info({
    message: "submission_worker_started",
    queue: "submission_analysis",
  });
}

/**
 * Get job status by ID
 */
export async function getJobStatus(jobId: string | number) {
  const queue = getSubmissionQueue();
  const job = await queue.getJob(jobId);

  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = (await job.progress()) ?? 0;

  return {
    id: job.id,
    state,
    progress,
    attempts: job.attemptsMade,
    maxAttempts: job.opts.attempts,
    data: job.data,
    result: job.returnvalue,
    error: job.failedReason,
    createdAt: new Date(job.timestamp).toISOString(),
  };
}
