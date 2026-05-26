class RuntimeHeartbeatCoordinator {
  constructor({ staleAfterMs = 10_000 } = {}) {
    this.staleAfterMs = staleAfterMs;
    this.heartbeats = new Map();
  }

  recordHeartbeat({ nodeId, status = "healthy", timestamp = new Date().toISOString(), metrics = {} }) {
    const heartbeat = {
      nodeId,
      status,
      timestamp,
      metrics,
      safetyMode: "readonly-safe-runtime-heartbeat"
    };
    this.heartbeats.set(nodeId, heartbeat);
    return heartbeat;
  }

  evaluate(nodes, now = new Date()) {
    return nodes.map((node) => {
      const heartbeat = this.heartbeats.get(node.nodeId) || null;
      const stale = !heartbeat || now.getTime() - new Date(heartbeat.timestamp).getTime() > this.staleAfterMs;
      const unhealthy = stale || heartbeat.status !== "healthy" || node.status !== "healthy";
      return {
        nodeId: node.nodeId,
        heartbeat,
        stale,
        unhealthy,
        status: unhealthy ? "unhealthy" : "healthy",
        reason: stale ? "stale-heartbeat" : heartbeat?.status || node.status
      };
    });
  }
}

module.exports = {
  RuntimeHeartbeatCoordinator
};
