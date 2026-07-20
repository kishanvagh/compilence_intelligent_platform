import AuditJob from "../../models/AuditJob.js";
import logger from "./logger.service.js";

/**
 * Background job queue for long-running audits.
 * Uses MongoDB as the job store with polling.
 * For production, replace with Bull/Redis.
 */
class JobQueueService {
  constructor() {
    this._processing = false;
    this._handlers = new Map();
    this._pollInterval = null;
    this._concurrency = parseInt(process.env.JOB_CONCURRENCY || "3", 10);
    this._activeJobs = 0;
  }

  /**
   * Register a job handler
   */
  registerHandler(jobType, handlerFn) {
    this._handlers.set(jobType, handlerFn);
  }

  /**
   * Enqueue a new audit job
   */
  async enqueue({
    userId,
    workspaceId,
    documentIds,
    framework,
    priority = 0,
    metadata = {},
  }) {
    const job = await AuditJob.create({
      userId,
      workspaceId,
      documentIds,
      framework,
      status: "queued",
      priority,
      metadata,
    });

    logger.info(`Job enqueued: ${job._id}`, {
      jobId: job._id,
      framework,
      documentCount: documentIds.length,
    });

    return job;
  }

  /**
   * Start processing jobs from the queue
   */
  start(intervalMs = 5000) {
    if (this._pollInterval) return;

    logger.info(`Job queue started (concurrency: ${this._concurrency}, poll interval: ${intervalMs}ms)`);

    this._pollInterval = setInterval(() => {
      this._processNextBatch();
    }, intervalMs);

    // Process immediately
    this._processNextBatch();
  }

  /**
   * Stop processing jobs
   */
  stop() {
    if (this._pollInterval) {
      clearInterval(this._pollInterval);
      this._pollInterval = null;
    }
    logger.info("Job queue stopped");
  }

  /**
   * Process the next batch of jobs
   */
  async _processNextBatch() {
    if (this._processing) return;
    if (this._activeJobs >= this._concurrency) return;

    this._processing = true;

    try {
      const availableSlots = this._concurrency - this._activeJobs;

      for (let s = 0; s < availableSlots; s++) {
        // Atomically claim the next queued job to prevent race conditions
        const job = await AuditJob.findOneAndUpdate(
          { status: "queued", retryCount: { $lt: 3 } },
          { $set: { status: "processing", startedAt: new Date() } },
          { sort: { priority: -1, createdAt: 1 }, returnDocument: 'after' }
        ).lean();

        if (!job) break;

        this._activeJobs++;
        this._processJob(job).finally(() => {
          this._activeJobs--;
          // Trigger next poll immediately to check for more work
          this._processNextBatch();
        });
      }
    } catch (error) {
      logger.error("Job queue processing error", { error: error.message });
    } finally {
      this._processing = false;
    }
  }

  /**
   * Process a single job
   */
  async _processJob(job) {
    const handler = this._handlers.get("compliance_audit");
    if (!handler) {
      logger.error(`No handler registered for compliance_audit`);
      await this._failJob(job._id, "No handler registered");
      return;
    }

    try {
      logger.info(`Processing job: ${job._id}`, { jobId: job._id, framework: job.framework });

      const result = await handler(job);

      await AuditJob.findByIdAndUpdate(job._id, {
        status: "completed",
        result,
        progress: 100,
        completedAt: new Date(),
      });

      logger.info(`Job completed: ${job._id}`, { jobId: job._id });
    } catch (error) {
      logger.error(`Job failed: ${job._id}`, { jobId: job._id, error: error.message });

      const retryCount = (job.retryCount || 0) + 1;
      if (retryCount >= 3) {
        await this._failJob(job._id, error.message);
      } else {
        await AuditJob.findByIdAndUpdate(job._id, {
          status: "queued",
          retryCount,
          error: error.message,
        });
      }
    }
  }

  /**
   * Mark a job as failed
   */
  async _failJob(jobId, errorMessage) {
    await AuditJob.findByIdAndUpdate(jobId, {
      status: "failed",
      error: errorMessage,
      completedAt: new Date(),
    });
  }

  /**
   * Update job progress
   */
  async updateProgress(jobId, completedControls, totalControls) {
    const progress = totalControls > 0 ? Math.round((completedControls / totalControls) * 100) : 0;
    await AuditJob.findByIdAndUpdate(jobId, {
      progress,
      completedControls,
      totalControls,
    });
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId) {
    return AuditJob.findById(jobId).lean();
  }

  /**
   * Get all jobs for a user
   */
  async getUserJobs(userId, limit = 20, skip = 0) {
    return AuditJob.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId, userId) {
    const job = await AuditJob.findOneAndUpdate(
      { _id: jobId, userId, status: { $in: ["queued", "processing"] } },
      { status: "cancelled" },
      { returnDocument: 'after' }
    );
    return job;
  }
}

// Singleton instance
const jobQueue = new JobQueueService();

export default jobQueue;
export { JobQueueService };