class RuntimeNodeRouter {
  route({ nodes = [], nodeHealth = [], capability, avoidNodeIds = [] }) {
    const candidates = nodes
      .filter((node) => node.enabled && node.readonly && !avoidNodeIds.includes(node.nodeId))
      .map((node) => {
        const health = nodeHealth.find((item) => item.nodeId === node.nodeId);
        const capableWorkers = node.workers.filter(
          (worker) =>
            worker.enabled &&
            worker.readonly &&
            worker.healthStatus === "healthy" &&
            (!capability || worker.capabilities.includes(capability)) &&
            worker.activeExecutions < worker.concurrencyLimit
        );
        const capacity = capableWorkers.reduce((total, worker) => total + (worker.concurrencyLimit - worker.activeExecutions), 0);
        return {
          node,
          health,
          capableWorkers,
          capacity,
          score: (health?.status === "healthy" ? 100 : 0) + capacity * 10 - (health?.executionPressure || 0)
        };
      })
      .filter((candidate) => candidate.health?.status === "healthy" && candidate.capableWorkers.length > 0)
      .sort((left, right) => right.score - left.score);

    const selected = candidates[0] || null;
    return {
      routeId: `distributed_route_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      capability,
      selectedNodeId: selected?.node.nodeId || null,
      selectedWorkerId: selected?.capableWorkers[0]?.workerId || null,
      candidates: candidates.map((candidate) => ({
        nodeId: candidate.node.nodeId,
        workerIds: candidate.capableWorkers.map((worker) => worker.workerId),
        capacity: candidate.capacity,
        score: candidate.score
      })),
      fallback: selected
        ? null
        : {
            safeMode: true,
            reason: "no-healthy-node-with-capability"
          },
      safetyMode: "readonly-safe-runtime-routing"
    };
  }
}

module.exports = {
  RuntimeNodeRouter
};
