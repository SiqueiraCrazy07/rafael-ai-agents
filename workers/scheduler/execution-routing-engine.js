class ExecutionRoutingEngine {
  selectRoute(job = {}, workers = []) {
    const requiredCapability = job.requiredCapability || job.capability || "runtime-read";
    const candidates = workers
      .filter((worker) =>
        worker.enabled !== false &&
        worker.readonly !== false &&
        worker.healthStatus === "healthy" &&
        Array.isArray(worker.capabilities) &&
        worker.capabilities.includes(requiredCapability) &&
        Number(worker.activeExecutions || 0) < Number(worker.concurrencyLimit || 1)
      )
      .map((worker) => {
        const activeExecutions = Number(worker.activeExecutions || 0);
        const concurrencyLimit = Number(worker.concurrencyLimit || 1);
        const utilization = concurrencyLimit > 0 ? activeExecutions / concurrencyLimit : 1;
        return {
          worker,
          utilization,
          score: (1 - utilization) * 100 - Number(worker.assignedCount || 0)
        };
      })
      .sort((left, right) => right.score - left.score);

    const selected = candidates[0] || null;
    return {
      workflowId: job.workflowId || job.workflow || job.jobId,
      requiredCapability,
      selectedWorkerId: selected ? selected.worker.workerId : null,
      routeStatus: selected ? "routed" : "protected",
      avoidedWorkers: workers
        .filter((worker) =>
          worker.healthStatus === "unhealthy" ||
          Number(worker.activeExecutions || 0) >= Number(worker.concurrencyLimit || 1) ||
          worker.enabled === false ||
          worker.readonly === false ||
          !Array.isArray(worker.capabilities) ||
          !worker.capabilities.includes(requiredCapability)
        )
        .map((worker) => ({
          workerId: worker.workerId,
          healthStatus: worker.healthStatus,
          activeExecutions: worker.activeExecutions || 0,
          concurrencyLimit: worker.concurrencyLimit || 1,
          reason: this.reasonForAvoidance(worker, requiredCapability)
        })),
      candidates: candidates.map((candidate) => ({
        workerId: candidate.worker.workerId,
        utilization: candidate.utilization,
        score: candidate.score
      })),
      fallback: selected ? null : {
        safeMode: true,
        reason: "no-healthy-capable-worker-available"
      }
    };
  }

  reasonForAvoidance(worker, requiredCapability) {
    if (worker.enabled === false) {
      return "worker-disabled";
    }
    if (worker.readonly === false) {
      return "worker-not-readonly";
    }
    if (worker.healthStatus === "unhealthy") {
      return "worker-unhealthy";
    }
    if (Number(worker.activeExecutions || 0) >= Number(worker.concurrencyLimit || 1)) {
      return "worker-saturated";
    }
    if (!Array.isArray(worker.capabilities) || !worker.capabilities.includes(requiredCapability)) {
      return "capability-mismatch";
    }
    return "not-selected";
  }
}

module.exports = {
  ExecutionRoutingEngine
};
