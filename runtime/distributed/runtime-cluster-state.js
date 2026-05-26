class RuntimeClusterState {
  build({ nodes = [], nodeHealth = [], leases = [], selfHealing = null, replay = null }) {
    const workers = nodes.flatMap((node) => node.workers);
    const unhealthyWorkers = workers.filter((worker) => worker.healthStatus !== "healthy");
    const activeWorkers = workers.filter((worker) => worker.enabled && worker.healthStatus === "healthy");
    const activeLeases = leases.filter((lease) => lease.status === "active");
    const queuePressure = selfHealing?.failuresDetected?.filter((signal) => signal.type === "queue-saturation").length || 0;
    const replayPressure = replay?.validation?.warnings?.length || 0;
    const executionPressure = nodeHealth.reduce((total, node) => total + node.executionPressure, 0);
    return {
      clusterStateId: `cluster_state_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      generatedAt: new Date().toISOString(),
      readonly: true,
      nodes: {
        total: nodes.length,
        healthy: nodeHealth.filter((node) => node.status === "healthy").length,
        unhealthy: nodeHealth.filter((node) => node.status !== "healthy").length
      },
      workers: {
        total: workers.length,
        active: activeWorkers.length,
        unhealthy: unhealthyWorkers.length,
        unhealthyWorkerIds: unhealthyWorkers.map((worker) => worker.workerId)
      },
      leases: {
        total: leases.length,
        active: activeLeases.length,
        expired: leases.filter((lease) => lease.status === "expired").length
      },
      pressure: {
        queuePressure,
        executionPressure,
        replayPressure
      },
      safetyMode: "readonly-safe-runtime-cluster-state"
    };
  }
}

module.exports = {
  RuntimeClusterState
};
