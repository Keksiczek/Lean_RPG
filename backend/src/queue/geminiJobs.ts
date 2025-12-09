import EventEmitter from "events";
import logger from "../lib/logger.js";
import { GeminiService } from "../services/GeminiService.js";

export type GeminiJobData = {
  submissionId: number;
  requestId?: string;
};

type JobState = "waiting" | "active" | "completed" | "failed";

interface SimpleJob<T> {
  id: number;
  data: T;
  state: JobState;
  attemptsMade: number;
}

class SimpleQueue<T> extends EventEmitter {
  private jobs: SimpleJob<T>[] = [];
  private processor?: (job: SimpleJob<T>) => Promise<void>;
  private idCounter = 1;

  process(processor: (job: SimpleJob<T>) => Promise<void>) {
    this.processor = processor;
  }

  async add(data: T) {
    const job: SimpleJob<T> = {
      id: this.idCounter++,
      data,
      state: "waiting",
      attemptsMade: 0,
    };

    this.jobs.push(job);
    this.runJob(job);
    return job;
  }

  private async runJob(job: SimpleJob<T>) {
    if (!this.processor) return;
    job.state = "active";
    try {
      await this.processor(job);
      job.state = "completed";
      this.emit("completed", job);
    } catch (err) {
      job.state = "failed";
      job.attemptsMade += 1;
      this.emit("failed", job, err);
    }
  }

  async getJob(id: number) {
    return this.jobs.find((job) => job.id === id) ?? null;
  }

  async getWaitingCount() {
    return this.jobs.filter((job) => job.state === "waiting").length;
  }
}

const geminiQueue = new SimpleQueue<GeminiJobData>();

export async function enqueueGeminiAnalysisJob(jobData: GeminiJobData) {
  const job = await geminiQueue.add(jobData);

  logger.info({
    message: "gemini_job_enqueued",
    context: "queue",
    jobId: job.id,
    submissionId: jobData.submissionId,
    requestId: jobData.requestId,
  });

  return job;
}

export function registerGeminiProcessor(service: GeminiService) {
  geminiQueue.process(async (job: SimpleJob<GeminiJobData>) => {
    await service.processSubmission(job.data);
  });

  geminiQueue.on("completed", (job: SimpleJob<GeminiJobData>) => {
    logger.info({
      message: "gemini_job_completed",
      context: "queue",
      jobId: job.id,
      submissionId: job.data.submissionId,
    });
  });

  geminiQueue.on("failed", (job: SimpleJob<GeminiJobData> | null, err: Error) => {
    logger.error({
      message: "gemini_job_failed",
      context: "queue",
      jobId: job?.id,
      submissionId: job?.data?.submissionId,
      error: err,
    });
  });
}

export function getGeminiQueue() {
  return geminiQueue;
}

export async function getJobStatus(jobId: number) {
  const job = await geminiQueue.getJob(jobId);
  if (!job) return "failed" as const;
  if (job.state === "completed") return "completed" as const;
  if (job.state === "failed") return "failed" as const;
  if (job.state === "active") return "processing" as const;
  return "pending" as const;
}

export async function getQueuePosition(jobId: number) {
  const job = await geminiQueue.getJob(jobId);
  if (!job) return -1;
  return geminiQueue.getWaitingCount();
}
