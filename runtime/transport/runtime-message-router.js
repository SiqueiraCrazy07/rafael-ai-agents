class RuntimeMessageRouter {
  route({ envelope, distributedRuntime, replication = null }) {
    const nodeHealth = distributedRuntime?.nodeHealth || [];
    const nodes = distributedRuntime?.nodes || [];
    const splitBrain = replication?.consensus?.splitBrain?.detected === true;
    const avoidNodeIds = new Set([
      ...(envelope.routing.avoidNodeIds || []),
      ...nodeHealth.filter((node) => node.status !== "healthy").map((node) => node.nodeId),
      ...(splitBrain ? replication.consensus.splitBrain.evidence.staleActiveLeaseNodes || [] : [])
    ]);

    const candidates = nodes
      .filter((node) => !avoidNodeIds.has(node.nodeId))
      .map((node) => {
        const health = nodeHealth.find((item) => item.nodeId === node.nodeId);
        const workers = Array.isArray(node.workers) ? node.workers : [];
        const capableWorkers = workers.filter(
          (worker) =>
            worker.healthStatus === "healthy" &&
            worker.capabilities.includes(envelope.capability) &&
            worker.activeExecutions < worker.concurrencyLimit
        );
        const capacity = capableWorkers.reduce((total, worker) => total + worker.concurrencyLimit - worker.activeExecutions, 0);
        return {
          nodeId: node.nodeId,
          status: health?.status || node.status,
          capableWorkers: capableWorkers.map((worker) => worker.workerId),
          capacity,
          score: (health?.status === "healthy" ? 100 : 0) + capacity * 10 - Number(health?.executionPressure || 0)
        };
      })
      .filter((candidate) => candidate.status === "healthy" && candidate.capacity > 0)
      .sort((left, right) => right.score - left.score);

    const selected = envelope.routing.preferredNodeId
      ? candidates.find((candidate) => candidate.nodeId === envelope.routing.preferredNodeId) || candidates[0]
      : candidates[0];

    return {
      routeId: `transport_route_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      selectedNodeId: selected?.nodeId || null,
      selectedWorkerId: selected?.capableWorkers[0] || null,
      candidates,
      avoidedNodes: [...avoidNodeIds],
      balanced: candidates.length > 1,
      fallback: selected
        ? null
        : {
            safeMode: true,
            reason: "no-healthy-transport-route"
          },
      safetyMode: "readonly-safe-transport-routing"
    };
  }
}

module.exports = {
  RuntimeMessageRouter
};
