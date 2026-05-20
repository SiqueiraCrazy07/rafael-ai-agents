class WorkerLoadBalancer {
  optimize({ latestQueue, latestPredictive }) {
    const saturated = new Set((latestPredictive?.saturatedWorkers || []).map((worker) => worker.workerId));
    const assignments = new Map();

    for (const result of latestQueue?.results || []) {
      if (!result.workerId) {
        continue;
      }
      assignments.set(result.workerId, (assignments.get(result.workerId) || 0) + 1);
    }

    const workers = latestQueue?.workers || [];
    const healthyWorkers = workers.filter((worker) => !saturated.has(worker.workerId));

    return {
      optimizer: "worker-load-balancer",
      saturatedWorkers: [...saturated],
      assignments: Object.fromEntries(assignments),
      recommendedRebalance: [...saturated].map((workerId) => ({
        from: workerId,
        to: healthyWorkers.map((worker) => worker.workerId),
        action: healthyWorkers.length > 0 ? "shift-new-work-to-healthy-workers" : "hold-and-throttle",
        reason: "worker predicted as saturated"
      }))
    };
  }
}

module.exports = {
  WorkerLoadBalancer
};
