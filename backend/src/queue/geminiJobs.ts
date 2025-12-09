import Queue from "bull";
import { config } from "../config.js";
import logger from "../lib/logger.js";
import { GeminiService } from "../services/GeminiService.js";

export type GeminiJobData = {
  submissionId: number;
  requestId?: string;
};

const geminiQueue = new Queue<GeminiJobData>("gemini-jobs", config.redis.url);

export function enqueueGeminiAnalysisJob(jobData: GeminiJobData) {
  return geminiQueue.add(jobData, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 500,
    },
    removeOnComplete: true,
    removeOnFail: false,
  });
}

export function registerGeminiProcessor(service: GeminiService) {
  geminiQueue.process(async (job) => {
    await service.processSubmission(job.data);
  });

  geminiQueue.on("completed", (job) => {
    logger.info({
      message: "gemini_job_completed",
      jobId: job.id,
      submissionId: job.data.submissionId,
    });
  });

  geminiQueue.on("failed", (job, err) => {
    logger.error({
      message: "gemini_job_failed",
      jobId: job?.id,
      submissionId: job?.data?.submissionId,
      error: err,
    });
  });
}

export function getGeminiQueue() {
  return geminiQueue;
}
