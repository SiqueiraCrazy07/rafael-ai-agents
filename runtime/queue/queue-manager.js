const { WorkflowQueue } = require("./workflow-queue");
const { RetryQueue } = require("./retry-queue");

class RuntimeQueueManager {
  constructor({ telemetry } = {}) {
    this.workflowQueue = new WorkflowQueue();
    this.retryQueue = new RetryQueue();
    this.telemetry = telemetry;
  }

  enqueue(workflowRequest) {
    const item = this.workflowQueue.enqueue(workflowRequest);
    this.telemetry?.record("queue_item_enqueued", {
      queueId: item.queueId,
      workflow: item.workflow,
      priority: item.priority
    });
    return item;
  }

  dequeue() {
    const item = this.workflowQueue.dequeue();
    if (item) {
      this.telemetry?.record("queue_item_dequeued", {
        queueId: item.queueId,
        workflow: item.workflow
      });
    }
    return item;
  }

  enqueueRetry(item, error) {
    const retryItem = this.retryQueue.enqueueFailed(item, error);
    this.telemetry?.record("queue_item_retry_queued", {
      queueId: item.queueId,
      workflow: item.workflow,
      attempts: retryItem.attempts,
      error
    });
    return retryItem;
  }

  dequeueRetry() {
    const item = this.retryQueue.dequeueReady();
    if (item) {
      this.telemetry?.record("retry_item_dequeued", {
        queueId: item.queueId,
        workflow: item.workflow,
        attempts: item.attempts
      });
    }
    return item;
  }

  list() {
    return this.workflowQueue.list();
  }

  listRetries() {
    return this.retryQueue.list();
  }
}

module.exports = {
  RuntimeQueueManager
};
