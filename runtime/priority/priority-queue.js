const PRIORITY_WEIGHT = Object.freeze({
  p0: 0,
  p1: 1,
  p2: 2,
  p3: 3
});

class PriorityQueue {
  constructor() {
    this.items = [];
  }

  enqueue(item) {
    this.items.push(item);
    return item;
  }

  dequeue() {
    const queued = this.items
      .filter((item) => item.status === "queued")
      .sort((left, right) => {
        const priorityDiff = PRIORITY_WEIGHT[left.priority] - PRIORITY_WEIGHT[right.priority];
        if (priorityDiff !== 0) {
          return priorityDiff;
        }

        return left.queuedAt.localeCompare(right.queuedAt);
      });

    const next = queued[0] || null;
    if (!next) {
      return null;
    }

    next.status = "dequeued";
    next.dequeuedAt = new Date().toISOString();
    return next;
  }

  list() {
    return [...this.items];
  }
}

module.exports = {
  PRIORITY_WEIGHT,
  PriorityQueue
};
