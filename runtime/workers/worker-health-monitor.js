class WorkerHealthMonitor {
  constructor(options = {}) {
    this.minimumExecutions = options.minimumExecutions || 2;
    this.unhealthySuccessRateThreshold = options.unhealthySuccessRateThreshold ?? 0.5;
  }

  evaluate(workers, executionResults) {
    const workerHealth = workers.map((worker) => {
      const results = executionResults.filter((result) => result.workerId === worker.workerId);
      const successful = results.filter((result) => result.status === "completed").length;
      const failed = results.filter((result) => result.status === "failed").length;
      const throttled = results.filter((result) => result.status === "throttled").length;
      const paused = worker.status === "paused" || worker.healthStatus === "paused";
      const total = results.length;
      const successRate = total === 0 ? 1 : successful / total;
      const unhealthy =
        worker.enabled === false ||
        worker.status === "unavailable" ||
        (total >= this.minimumExecutions && successRate < this.unhealthySuccessRateThreshold);

      return {
        workerId: worker.workerId,
        capabilities: worker.capabilities,
        enabled: worker.enabled,
        status: worker.status,
        healthStatus: unhealthy ? "unhealthy" : paused ? "paused" : "healthy",
        successRate,
        totalExecutions: total,
        successfulExecutions: successful,
        failedExecutions: failed,
        throttledExecutions: throttled,
        throttledState: throttled > 0,
        pausedState: paused,
        unhealthy,
        reason: unhealthy
          ? worker.unavailableReason || "success-rate-below-threshold-or-worker-unavailable"
          : null
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      workers: workerHealth,
      unhealthyWorkers: workerHealth.filter((worker) => worker.unhealthy),
      fallback: {
        safeMode: true,
        noExecutionsAssumedHealthy: true
      }
    };
  }
}

module.exports = {
  WorkerHealthMonitor
};
