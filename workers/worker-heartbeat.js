class WorkerHeartbeat {
  constructor({ staleAfterMs = 30000 } = {}) {
    this.staleAfterMs = staleAfterMs;
    this.heartbeats = new Map();
  }

  beat(workerId, at = new Date()) {
    const timestamp = at.toISOString();
    this.heartbeats.set(workerId, timestamp);
    return {
      workerId,
      timestamp,
      status: "heartbeat-recorded"
    };
  }

  getLastHeartbeat(workerId) {
    return this.heartbeats.get(workerId) || null;
  }

  evaluate(workers, now = new Date()) {
    const nowMs = now.getTime();
    const staleWorkers = [];
    const healthyWorkers = [];

    for (const worker of workers) {
      const lastHeartbeatAt = worker.lastHeartbeatAt || this.getLastHeartbeat(worker.workerId);
      const ageMs = lastHeartbeatAt ? nowMs - new Date(lastHeartbeatAt).getTime() : Number.POSITIVE_INFINITY;
      const record = {
        workerId: worker.workerId,
        lastHeartbeatAt,
        ageMs,
        staleAfterMs: this.staleAfterMs
      };

      if (ageMs > this.staleAfterMs) {
        staleWorkers.push({
          ...record,
          reason: lastHeartbeatAt ? "heartbeat-stale" : "heartbeat-missing"
        });
      } else {
        healthyWorkers.push(record);
      }
    }

    return {
      checkedAt: now.toISOString(),
      healthyWorkers,
      staleWorkers,
      fallback: staleWorkers.length > 0
        ? {
            safeMode: true,
            behavior: "stale workers are excluded from new assignments"
          }
        : null
    };
  }
}

module.exports = {
  WorkerHeartbeat
};
