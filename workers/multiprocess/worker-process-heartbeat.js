class WorkerProcessHeartbeat {
  constructor({ staleAfterMs = 5000 } = {}) {
    this.staleAfterMs = staleAfterMs;
    this.heartbeats = new Map();
  }

  record({ processId, workerId, timestamp = new Date().toISOString(), status = "alive", metrics = {} }) {
    const heartbeat = {
      heartbeatId: `mp_heartbeat_${processId}_${Date.now()}`,
      processId,
      workerId,
      timestamp,
      status,
      metrics,
      readonly: true,
      safetyMode: "readonly-safe-multiprocess-heartbeat"
    };
    this.heartbeats.set(processId, heartbeat);
    return heartbeat;
  }

  evaluate(processes = [], now = new Date()) {
    return processes.map((processRecord) => {
      const heartbeat = this.heartbeats.get(processRecord.processId);
      const ageMs = heartbeat ? now.getTime() - new Date(heartbeat.timestamp).getTime() : null;
      const terminal = ["completed", "crashed", "failed", "error"].includes(processRecord.status);
      const stale = terminal && heartbeat ? false : (!heartbeat || ageMs > this.staleAfterMs);
      return {
        processId: processRecord.processId,
        workerId: processRecord.workerId,
        heartbeat,
        stale,
        ageMs,
        status: stale ? "unhealthy" : "healthy",
        reason: stale ? (!heartbeat ? "missing-heartbeat" : "stale-heartbeat") : "heartbeat-current",
        recoveryMetadata: stale
          ? {
              recommendation: "reroute-and-consider-worker-restart",
              requiresHumanGate: false
            }
          : null
      };
    });
  }
}

module.exports = {
  WorkerProcessHeartbeat
};
