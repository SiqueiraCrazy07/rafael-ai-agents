class RuntimeNodeRegistry {
  constructor() {
    this.nodes = new Map();
  }

  registerNode(input) {
    const node = {
      nodeId: input.nodeId,
      status: input.status || "healthy",
      enabled: input.enabled !== false,
      readonly: input.readonly !== false,
      capabilities: input.capabilities || [],
      workers: [],
      metadata: input.metadata || {},
      registeredAt: input.registeredAt || new Date().toISOString(),
      safetyMode: "readonly-safe-runtime-node"
    };
    this.nodes.set(node.nodeId, node);
    return node;
  }

  registerWorker(nodeId, worker) {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`runtime node not registered: ${nodeId}`);
    }
    const registeredWorker = {
      workerId: worker.workerId,
      nodeId,
      capabilities: worker.capabilities || [],
      concurrencyLimit: worker.concurrencyLimit || 1,
      activeExecutions: worker.activeExecutions || 0,
      healthStatus: worker.healthStatus || "healthy",
      enabled: worker.enabled !== false,
      readonly: worker.readonly !== false,
      registeredAt: new Date().toISOString()
    };
    node.workers.push(registeredWorker);
    return registeredWorker;
  }

  listNodes() {
    return [...this.nodes.values()];
  }

  listWorkers() {
    return this.listNodes().flatMap((node) => node.workers);
  }
}

module.exports = {
  RuntimeNodeRegistry
};
