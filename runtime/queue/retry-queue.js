class RetryQueue {
  constructor() {
    this.items = [];
  }

  enqueueFailed(item, error) {
    const retryItem = {
      ...item,
      retryQueueId: `retry_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      attempts: item.attempts + 1,
      status: "retry_queued",
      lastError: error,
      retryQueuedAt: new Date().toISOString()
    };

    this.items.push(retryItem);
    return retryItem;
  }

  dequeueReady() {
    const next = this.items.find((item) => item.status === "retry_queued");
    if (!next) {
      return null;
    }

    next.status = "dequeued";
    next.retryDequeuedAt = new Date().toISOString();
    return {
      ...next,
      status: "queued",
      requeuedAt: new Date().toISOString()
    };
  }

  list() {
    return [...this.items];
  }
}

module.exports = {
  RetryQueue
};
