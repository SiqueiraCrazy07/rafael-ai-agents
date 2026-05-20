class WorkerRegistry {
  constructor() {
    this.workers = [];
  }

  register({
    workerId,
    name,
    capabilities = [],
    capacity = null,
    concurrencyLimit = null,
    readonly = true,
    enabled = true,
    status = "active",
    healthStatus = "healthy"
  }) {
    const effectiveConcurrency = concurrencyLimit || capacity || 1;
    const worker = {
      workerId,
      name,
      capabilities,
      capacity: effectiveConcurrency,
      concurrencyLimit: effectiveConcurrency,
      readonly,
      enabled,
      status: enabled ? status : "disabled",
      healthStatus,
      running: 0,
      registeredAt: new Date().toISOString()
    };

    const existingIndex = this.workers.findIndex((candidate) => candidate.workerId === workerId);
    if (existingIndex >= 0) {
      this.workers[existingIndex] = {
        ...this.workers[existingIndex],
        ...worker,
        registeredAt: this.workers[existingIndex].registeredAt,
        updatedAt: new Date().toISOString()
      };
      return { ...this.workers[existingIndex] };
    }

    this.workers.push(worker);
    return worker;
  }

  findAvailable(item) {
    const requiredCapabilities = item.payload?.capabilities || [];

    return this.workers
      .filter((worker) => worker.enabled !== false)
      .filter((worker) => worker.status === "active")
      .filter((worker) => worker.healthStatus !== "unhealthy")
      .filter((worker) => worker.running < worker.concurrencyLimit)
      .map((worker) => ({
        worker,
        matches:
          requiredCapabilities.length === 0
            ? worker.capabilities.length
            : requiredCapabilities.filter((capability) => worker.capabilities.includes(capability)).length
      }))
      .filter((candidate) => requiredCapabilities.length === 0 || candidate.matches > 0)
      .sort((left, right) => {
        const matchDiff = right.matches - left.matches;
        if (matchDiff !== 0) {
          return matchDiff;
        }

        return left.worker.running - right.worker.running;
      })[0]?.worker || null;
  }

  markUnavailable(workerId, reason = "unavailable") {
    const worker = this.workers.find((candidate) => candidate.workerId === workerId);
    if (!worker) {
      return null;
    }

    worker.status = "unavailable";
    worker.unavailableReason = reason;
    worker.unavailableAt = new Date().toISOString();
    return { ...worker };
  }

  markHealth(workerId, healthStatus, reason = null) {
    const worker = this.workers.find((candidate) => candidate.workerId === workerId);
    if (!worker) {
      return null;
    }

    worker.healthStatus = healthStatus;
    worker.healthReason = reason;
    worker.healthUpdatedAt = new Date().toISOString();
    if (healthStatus === "unhealthy") {
      worker.status = "unavailable";
      worker.unavailableReason = reason || "worker-health-unhealthy";
      worker.unavailableAt = worker.healthUpdatedAt;
    }
    return { ...worker };
  }

  list() {
    return this.workers.map((worker) => ({ ...worker }));
  }
}

module.exports = {
  WorkerRegistry
};
