class WorkerProcessRegistry {
  constructor() {
    this.workers = new Map();
    this.processes = new Map();
  }

  registerWorker(worker = {}) {
    const record = {
      workerId: worker.workerId || `mp_worker_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      nodeId: worker.nodeId || "runtime-node-a",
      capabilities: worker.capabilities || ["runtime-read"],
      readonly: worker.readonly !== false,
      enabled: worker.enabled !== false,
      healthStatus: worker.healthStatus || "healthy",
      processId: null,
      owner: "multiprocess-worker-runtime",
      createdAt: new Date().toISOString(),
      safetyMode: "readonly-safe-multiprocess-worker-registry"
    };
    this.workers.set(record.workerId, record);
    return record;
  }

  attachProcess(workerId, processRecord) {
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.processId = processRecord.processId;
      worker.pid = processRecord.pid;
      worker.status = processRecord.status;
    }
    this.processes.set(processRecord.processId, processRecord);
    return worker || null;
  }

  updateProcess(processId, patch = {}) {
    const current = this.processes.get(processId);
    if (!current) {
      return null;
    }
    const updated = { ...current, ...patch, updatedAt: new Date().toISOString() };
    this.processes.set(processId, updated);
    const worker = this.workers.get(updated.workerId);
    if (worker) {
      worker.status = updated.status;
      worker.healthStatus = updated.healthStatus || worker.healthStatus;
    }
    return updated;
  }

  listWorkers() {
    return [...this.workers.values()];
  }

  listProcesses() {
    return [...this.processes.values()];
  }

  unhealthyWorkers() {
    return this.listWorkers().filter((worker) => worker.healthStatus !== "healthy" || worker.enabled === false);
  }
}

module.exports = {
  WorkerProcessRegistry
};
