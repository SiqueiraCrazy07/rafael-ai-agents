class WorkerPool {
  constructor() {
    this.workers = new Map();
  }

  registerWorker(worker) {
    if (!worker || !worker.workerId) {
      throw new Error("workerId is required");
    }
    if (worker.readonly !== true) {
      throw new Error(`worker ${worker.workerId} rejected: readonly=true is required`);
    }

    const normalized = {
      workerId: worker.workerId,
      capabilities: Array.isArray(worker.capabilities) ? worker.capabilities : [],
      concurrencyLimit: Math.max(1, Number(worker.concurrencyLimit || 1)),
      readonly: true,
      enabled: worker.enabled !== false,
      healthStatus: worker.healthStatus || "healthy",
      activeExecutions: 0,
      completedExecutions: 0,
      failedExecutions: 0,
      throttledExecutions: 0,
      assignedCount: 0,
      lastHeartbeatAt: worker.lastHeartbeatAt || null,
      metadata: worker.metadata || {}
    };
    this.workers.set(normalized.workerId, normalized);
    return normalized;
  }

  listWorkers() {
    return [...this.workers.values()].map((worker) => ({ ...worker }));
  }

  getWorker(workerId) {
    const worker = this.workers.get(workerId);
    return worker ? { ...worker } : null;
  }

  updateWorker(workerId, updates) {
    const worker = this.workers.get(workerId);
    if (!worker) {
      return null;
    }
    Object.assign(worker, updates);
    return { ...worker };
  }

  markUnhealthy(workerId, reason) {
    return this.updateWorker(workerId, {
      healthStatus: "unhealthy",
      unhealthyReason: reason || "runtime-supervisor-detected"
    });
  }

  markHealthy(workerId) {
    return this.updateWorker(workerId, {
      healthStatus: "healthy",
      unhealthyReason: null
    });
  }

  heartbeat(workerId, timestamp = new Date().toISOString()) {
    return this.updateWorker(workerId, {
      lastHeartbeatAt: timestamp
    });
  }

  recordAssignment(workerId) {
    const worker = this.workers.get(workerId);
    if (!worker) {
      return null;
    }
    worker.activeExecutions += 1;
    worker.assignedCount += 1;
    return { ...worker };
  }

  releaseAssignment(workerId, status) {
    const worker = this.workers.get(workerId);
    if (!worker) {
      return null;
    }
    worker.activeExecutions = Math.max(0, worker.activeExecutions - 1);
    if (status === "completed") {
      worker.completedExecutions += 1;
    } else if (status === "failed") {
      worker.failedExecutions += 1;
    } else if (status === "throttled") {
      worker.throttledExecutions += 1;
    }
    return { ...worker };
  }

  availableWorkersFor(job) {
    return this.listWorkers().filter((worker) => {
      const requiredCapability = job.requiredCapability;
      const capabilityMatch = !requiredCapability || worker.capabilities.includes(requiredCapability);
      return (
        worker.enabled &&
        worker.readonly &&
        worker.healthStatus === "healthy" &&
        capabilityMatch &&
        worker.activeExecutions < worker.concurrencyLimit
      );
    });
  }

  saturatedWorkers() {
    return this.listWorkers().filter((worker) =>
      worker.enabled &&
      worker.healthStatus === "healthy" &&
      worker.activeExecutions >= worker.concurrencyLimit
    );
  }
}

module.exports = {
  WorkerPool
};
