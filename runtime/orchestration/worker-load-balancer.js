class WorkerLoadBalancer {
  constructor(options = {}) {
    this.throttling = options.throttling || {
      enabled: false,
      maxAssignmentsPerWorker: Infinity
    };
  }

  selectWorker(queueItem, workers) {
    const requiredCapabilities = queueItem.payload?.capabilities || [];
    const candidates = workers
      .filter((worker) => worker.enabled !== false)
      .filter((worker) => worker.status === "active")
      .filter((worker) => worker.healthStatus !== "unhealthy")
      .filter((worker) => worker.running < worker.concurrencyLimit)
      .filter((worker) => {
        if (!Number.isFinite(this.throttling.maxAssignmentsPerWorker)) {
          return true;
        }
        return worker.assignedCount < this.throttling.maxAssignmentsPerWorker;
      })
      .map((worker) => ({
        worker,
        capabilityMatches: requiredCapabilities.length === 0
          ? worker.capabilities.length
          : requiredCapabilities.filter((capability) => worker.capabilities.includes(capability)).length
      }))
      .filter((candidate) => requiredCapabilities.length === 0 || candidate.capabilityMatches > 0)
      .sort((left, right) => {
        const loadDiff = left.worker.assignedCount - right.worker.assignedCount;
        if (loadDiff !== 0) {
          return loadDiff;
        }
        return right.capabilityMatches - left.capabilityMatches;
      });

    const selected = candidates[0]?.worker || null;
    if (selected) {
      selected.assignedCount += 1;
    }

    return selected;
  }

  distribute(queueItems, workers) {
    const assignments = [];
    const protectedQueue = [];
    const waiting = [];

    for (const item of queueItems) {
      if (item.protectedQueue || item.payload?.requiresHumanGate) {
        protectedQueue.push({
          queueItem: item,
          reason: item.gatedReason || "protected-queue-awareness"
        });
        continue;
      }

      const worker = this.selectWorker(item, workers);
      if (!worker) {
        waiting.push({
          queueItem: item,
          reason: "no-healthy-worker-capacity"
        });
        continue;
      }

      assignments.push({
        queueItem: item,
        worker
      });
    }

    return {
      assignments,
      protectedQueue,
      waiting
    };
  }
}

module.exports = {
  WorkerLoadBalancer
};
