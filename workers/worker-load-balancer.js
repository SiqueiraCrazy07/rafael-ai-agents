class WorkerLoadBalancer {
  selectWorker(job, workers) {
    const candidates = workers
      .filter((worker) => {
        const requiredCapability = job.requiredCapability;
        const hasCapability = !requiredCapability || worker.capabilities.includes(requiredCapability);
        return (
          worker.enabled &&
          worker.readonly &&
          worker.healthStatus === "healthy" &&
          hasCapability &&
          worker.activeExecutions < worker.concurrencyLimit
        );
      })
      .sort((left, right) => {
        const leftUtilization = left.activeExecutions / left.concurrencyLimit;
        const rightUtilization = right.activeExecutions / right.concurrencyLimit;
        if (leftUtilization !== rightUtilization) {
          return leftUtilization - rightUtilization;
        }
        return left.assignedCount - right.assignedCount;
      });

    return candidates[0] || null;
  }

  planRebalance({ pendingJobs, workers, unhealthyWorkers = [], saturatedWorkers = [] }) {
    const unavailable = new Set([
      ...unhealthyWorkers.map((worker) => worker.workerId),
      ...saturatedWorkers.map((worker) => worker.workerId)
    ]);
    const rebalances = [];

    for (const job of pendingJobs) {
      const target = this.selectWorker(job, workers.filter((worker) => !unavailable.has(worker.workerId)));
      if (target) {
        rebalances.push({
          workflowId: job.workflowId || job.jobId,
          targetWorkerId: target.workerId,
          reason: "worker-balancer-found-healthy-capable-worker",
          safetyMode: "readonly-safe-rebalance"
        });
      }
    }

    return {
      rebalances,
      fallback: rebalances.length < pendingJobs.length
        ? {
            safeMode: true,
            reason: "some-jobs-left-in-protected-queue"
          }
        : null
    };
  }
}

module.exports = {
  WorkerLoadBalancer
};
