class WorkerRebalanceEngine {
  constructor(options = {}) {
    this.saturationThreshold = options.saturationThreshold ?? 1;
  }

  detectOverloadedWorkers(workers) {
    return workers
      .filter((worker) => worker.enabled !== false)
      .filter((worker) => worker.assignedCount >= worker.concurrencyLimit * this.saturationThreshold)
      .map((worker) => ({
        workerId: worker.workerId,
        assignedCount: worker.assignedCount,
        concurrencyLimit: worker.concurrencyLimit,
        healthStatus: worker.healthStatus,
        reason: "assigned-count-reached-concurrency-limit"
      }));
  }

  rebalance(assignments, workers) {
    const overloaded = this.detectOverloadedWorkers(workers);
    const rebalances = [];

    for (const overload of overloaded) {
      const movable = assignments.find((assignment) => assignment.worker.workerId === overload.workerId);
      if (!movable || movable.queueItem.protectedQueue || movable.queueItem.payload?.requiresHumanGate) {
        continue;
      }

      const target = workers
        .filter((worker) => worker.workerId !== overload.workerId)
        .filter((worker) => worker.enabled !== false)
        .filter((worker) => worker.status === "active")
        .filter((worker) => worker.healthStatus !== "unhealthy")
        .filter((worker) => worker.assignedCount < worker.concurrencyLimit)
        .find((worker) => {
          const required = movable.queueItem.payload?.capabilities || [];
          return required.length === 0 || required.some((capability) => worker.capabilities.includes(capability));
        });

      if (!target) {
        continue;
      }

      const previousWorkerId = movable.worker.workerId;
      movable.worker.assignedCount = Math.max(0, movable.worker.assignedCount - 1);
      target.assignedCount += 1;
      movable.worker = target;
      rebalances.push({
        workflow: movable.queueItem.workflow,
        queueId: movable.queueItem.queueId,
        fromWorkerId: previousWorkerId,
        toWorkerId: target.workerId,
        reason: "worker-overloaded-reroute-safe",
        protectedQueueAware: true
      });
    }

    return {
      overloadedWorkers: overloaded,
      rebalances
    };
  }
}

module.exports = {
  WorkerRebalanceEngine
};
