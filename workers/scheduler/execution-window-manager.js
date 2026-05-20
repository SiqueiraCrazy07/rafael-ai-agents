class ExecutionWindowManager {
  constructor(options = {}) {
    this.now = options.now || new Date();
    this.windowMs = options.windowMs || 60000;
    this.retryDelayMs = options.retryDelayMs || 30000;
    this.protectedReleaseDelayMs = options.protectedReleaseDelayMs || 90000;
  }

  createWindow(job, forecast) {
    const nowMs = this.now.getTime();
    const isRetry = job.retry === true || Number(job.attempt || 1) > 1;
    const isProtected = job.protected === true || job.priority === "gated";
    const highSaturation = forecast?.risks?.saturation === "high";
    const highRetryStorm = forecast?.risks?.retryStorm === "high";

    let type = "immediate";
    let scheduledAtMs = nowMs;
    let reason = "healthy-capacity-available";

    if (isRetry) {
      type = "retry";
      scheduledAtMs = nowMs + Number(job.retryDelayMs || this.retryDelayMs);
      reason = "retry-scheduling-delay";
    } else if (isProtected) {
      type = "protected-release";
      scheduledAtMs = nowMs + this.protectedReleaseDelayMs;
      reason = "protected-queue-release-window";
    } else if (highSaturation || highRetryStorm) {
      type = "delayed";
      scheduledAtMs = nowMs + this.windowMs;
      reason = highSaturation ? "saturation-risk-delay" : "retry-storm-risk-delay";
    }

    return {
      type,
      scheduledAt: new Date(scheduledAtMs).toISOString(),
      expiresAt: new Date(scheduledAtMs + this.windowMs).toISOString(),
      reason,
      safetyMode: "readonly-safe-scheduler-window"
    };
  }
}

module.exports = {
  ExecutionWindowManager
};
