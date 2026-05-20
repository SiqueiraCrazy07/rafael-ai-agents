class WorkerSupervisor {
  constructor({ heartbeat, leaseManager, workerPool }) {
    this.heartbeat = heartbeat;
    this.leaseManager = leaseManager;
    this.workerPool = workerPool;
  }

  inspect(now = new Date()) {
    const workers = this.workerPool.listWorkers();
    const heartbeat = this.heartbeat.evaluate(workers, now);
    for (const stale of heartbeat.staleWorkers) {
      this.workerPool.markUnhealthy(stale.workerId, stale.reason);
    }

    const saturatedWorkers = this.workerPool.saturatedWorkers();
    const expiredLeases = this.leaseManager.expireLeases(now);

    return {
      inspectedAt: now.toISOString(),
      heartbeat,
      unhealthyWorkers: heartbeat.staleWorkers,
      saturatedWorkers,
      expiredLeases,
      fallback: {
        safeMode: true,
        unhealthyWorkersExcluded: heartbeat.staleWorkers.length,
        saturatedWorkersProtected: saturatedWorkers.length,
        expiredLeasesReleased: expiredLeases.length
      }
    };
  }
}

module.exports = {
  WorkerSupervisor
};
