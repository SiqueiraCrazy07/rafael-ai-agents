function asArray(value) {
  return Array.isArray(value) ? value : [];
}

class ExecutionForecastEngine {
  forecast({ jobs = [], workers = [], telemetry = {}, sandboxReports = [] } = {}) {
    const healthyWorkers = workers.filter((worker) => worker.healthStatus === "healthy" && worker.enabled !== false);
    const unhealthyWorkers = workers.filter((worker) => worker.healthStatus === "unhealthy");
    const totalCapacity = healthyWorkers.reduce((total, worker) =>
      total + Math.max(0, Number(worker.concurrencyLimit || 1) - Number(worker.activeExecutions || 0)), 0);
    const retryCandidates = jobs.filter((job) => job.retry === true || Number(job.attempt || 1) > 1);
    const protectedCandidates = jobs.filter((job) => job.protected === true || job.priority === "gated");
    const telemetryMetrics = telemetry.metrics || {};
    const recentRetryCount = telemetryMetrics.retryCount || retryCandidates.length;
    const policyViolations = telemetryMetrics.workerSandboxPolicyViolations ||
      sandboxReports.flatMap((report) => asArray(report.policyViolations)).length;

    const saturationRisk = jobs.length > totalCapacity ? "high" : jobs.length >= Math.max(1, totalCapacity) ? "medium" : "low";
    const retryStormRisk = retryCandidates.length + recentRetryCount >= 3 ? "high" : retryCandidates.length > 0 ? "medium" : "low";
    const unhealthyWorkerRisk = unhealthyWorkers.length > 0 ? "medium" : "low";
    const queueGrowthRisk = jobs.length > 5 ? "medium" : "low";

    return {
      forecastId: `execution_forecast_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      capacity: {
        totalHealthyWorkers: healthyWorkers.length,
        unhealthyWorkers: unhealthyWorkers.map((worker) => worker.workerId),
        totalAvailableSlots: totalCapacity,
        queueDepth: jobs.length,
        protectedCandidates: protectedCandidates.length,
        retryCandidates: retryCandidates.length
      },
      risks: {
        saturation: saturationRisk,
        retryStorm: retryStormRisk,
        unhealthyWorkers: unhealthyWorkerRisk,
        queueGrowth: queueGrowthRisk,
        sandboxPolicyPressure: policyViolations > 0 ? "medium" : "low"
      },
      evidence: {
        telemetryReportId: telemetry.telemetryReportId || null,
        recentRetryCount,
        sandboxPolicyViolations: policyViolations
      },
      recommendation: saturationRisk === "high" || retryStormRisk === "high"
        ? "schedule-with-delays-and-protected-queue"
        : "schedule-normal-readonly-execution"
    };
  }
}

module.exports = {
  ExecutionForecastEngine
};
