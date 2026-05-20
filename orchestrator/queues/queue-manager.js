const PRIORITY_WEIGHT = Object.freeze({
  p0: 0,
  p1: 1,
  p2: 2,
  p3: 3
});

class QueueManager {
  constructor() {
    this.items = [];
  }

  enqueue({ project, workflow, objective, priority = "p2", criticidade = "medium", payload = {} }) {
    const existing = this.items.find(
      (item) =>
        item.project === project &&
        item.workflow === workflow &&
        item.objective === objective &&
        item.status === "queued"
    );

    if (existing) {
      return {
        ...existing,
        deduplicated: true
      };
    }

    const item = {
      queueId: `queue_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      project,
      workflow,
      objective,
      priority,
      criticidade,
      payload,
      status: "queued",
      queuedAt: new Date().toISOString()
    };

    this.items.push(item);
    return item;
  }

  dequeue() {
    const queued = this.items
      .filter((item) => item.status === "queued")
      .sort((a, b) => {
        const priorityDiff = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
        if (priorityDiff !== 0) {
          return priorityDiff;
        }
        return a.queuedAt.localeCompare(b.queuedAt);
      });

    const item = queued[0] || null;
    if (item) {
      item.status = "dequeued";
      item.dequeuedAt = new Date().toISOString();
    }
    return item;
  }

  list() {
    return [...this.items];
  }
}

module.exports = {
  QueueManager
};
