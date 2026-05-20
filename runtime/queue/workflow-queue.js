const { PriorityQueue } = require("../priority/priority-queue");

class WorkflowQueue {
  constructor() {
    this.priorityQueue = new PriorityQueue();
  }

  enqueue({ project, workflow, objective, priority = "p2", criticidade = "medium", payload = {} }) {
    const existing = this.priorityQueue
      .list()
      .find(
        (item) =>
          item.status === "queued" &&
          item.project === project &&
          item.workflow === workflow &&
          item.objective === objective
      );

    if (existing) {
      return {
        ...existing,
        deduplicated: true
      };
    }

    return this.priorityQueue.enqueue({
      queueId: `queue_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      executionId: `dist_exec_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`,
      project,
      workflow,
      objective,
      priority,
      criticidade,
      payload,
      attempts: 0,
      maxRetries: payload.maxRetries ?? (criticidade === "critical" ? 0 : criticidade === "high" ? 2 : 3),
      protectedQueue: Boolean(arguments[0].protectedQueue),
      gatedPriority: arguments[0].gatedPriority || null,
      gatedReason: arguments[0].gatedReason || null,
      status: "queued",
      queuedAt: new Date().toISOString()
    });
  }

  dequeue() {
    return this.priorityQueue.dequeue();
  }

  list() {
    return this.priorityQueue.list();
  }
}

module.exports = {
  WorkflowQueue
};
