import { Router, Request, Response } from "express";
import { Job } from "bull";
import { asyncHandler } from "../middleware/errorHandler.js";
import { NotFoundError } from "../middleware/errors.js";
import { getQueueStats, getSubmissionQueue } from "../queue/queueFactory.js";
import { getJobStatus } from "../queue/submissionWorker.js";
import { SubmissionAnalysisJob, JobResult } from "../types/jobs.js";

const router = Router();

/**
 * GET /api/jobs/:jobId - Get job status
 */
router.get(
  ["/:jobId", "/submission/:submissionId/job/:jobId"],
  asyncHandler(async (req: Request, res: Response) => {
    const { jobId } = req.params;

    const jobStatus = await getJobStatus(jobId);
    if (!jobStatus) {
      throw new NotFoundError(`Job #${jobId}`);
    }

    return res.json({
      job: jobStatus,
    });
  })
);

/**
 * GET /api/jobs/queue/stats - Get queue statistics (admin only)
 */
router.get(
  "/queue/stats",
  asyncHandler(async (_req: Request, res: Response) => {
    const stats = await getQueueStats();
    return res.json(stats);
  })
);

/**
 * GET /api/jobs/queue/jobs - List all jobs (admin only)
 */
router.get(
  "/queue/jobs",
  asyncHandler(async (req: Request, res: Response) => {
    const queue = getSubmissionQueue();
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const state = (req.query.state as string) ?? "active"; // active, completed, failed, waiting

    const jobs = await queue.getJobs([state], 0, -1, true);
    const paginated = jobs.slice((page - 1) * limit, page * limit);

    const mapped = await Promise.all(
      paginated.map(async (job: Job<SubmissionAnalysisJob>) => ({
        id: job.id,
        state: await job.getState(),
        progress: await job.progress(),
        attempts: job.attemptsMade,
        data: job.data,
        createdAt: new Date(job.timestamp).toISOString(),
      }))
    );

    return res.json({
      page,
      limit,
      total: jobs.length,
      jobs: mapped,
    });
  })
);

export default router;
