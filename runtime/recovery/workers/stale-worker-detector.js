class StaleWorkerDetector {
  constructor({ staleAfterMs = 30000 } = {}) {
    this.staleAfterMs = staleAfterMs;
  }

  detect(heartbeats, now = new Date()) {
    const nowMs = now.getTime();

    return heartbeats
      .filter((heartbeat) => {
        const lastSeenAt = new Date(heartbeat.lastSeenAt).getTime();
        return heartbeat.status !== "active" || nowMs - lastSeenAt > this.staleAfterMs;
      })
      .map((heartbeat) => ({
        ...heartbeat,
        staleForMs: nowMs - new Date(heartbeat.lastSeenAt).getTime(),
        reason:
          heartbeat.status !== "active"
            ? `worker status is ${heartbeat.status}`
            : `heartbeat older than ${this.staleAfterMs}ms`
      }));
  }
}

module.exports = {
  StaleWorkerDetector
};
