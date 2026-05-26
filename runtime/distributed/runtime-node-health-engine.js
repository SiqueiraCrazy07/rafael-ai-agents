class RuntimeNodeHealthEngine {
  evaluate({ nodes = [], heartbeatStatus = [], leases = [] }) {
    return nodes.map((node) => {
      const heartbeat = heartbeatStatus.find((item) => item.nodeId === node.nodeId);
      const nodeLeases = leases.filter((lease) => lease.nodeId === node.nodeId);
      const activeWorkers = node.workers.filter((worker) => worker.enabled && worker.healthStatus === "healthy");
      const unhealthyWorkers = node.workers.filter((worker) => worker.healthStatus !== "healthy");
      const executionPressure = node.workers.reduce(
        (total, worker) => total + worker.activeExecutions / Math.max(worker.concurrencyLimit, 1),
        0
      );
      const saturated = node.workers.some((worker) => worker.activeExecutions >= worker.concurrencyLimit);
      const status = heartbeat?.unhealthy || unhealthyWorkers.length === node.workers.length || !node.enabled ? "unhealthy" : "healthy";
      return {
        nodeId: node.nodeId,
        status,
        activeWorkers: activeWorkers.length,
        unhealthyWorkers: unhealthyWorkers.map((worker) => worker.workerId),
        activeLeases: nodeLeases.filter((lease) => lease.status === "active").length,
        executionPressure,
        saturated,
        heartbeatStatus: heartbeat?.status || "unknown",
        reason: status === "healthy" ? "node-healthy" : heartbeat?.reason || "node-unhealthy"
      };
    });
  }
}

module.exports = {
  RuntimeNodeHealthEngine
};
