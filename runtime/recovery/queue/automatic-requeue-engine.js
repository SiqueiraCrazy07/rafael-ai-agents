class AutomaticRequeueEngine {
  constructor({ queueManager }) {
    this.queueManager = queueManager;
  }

  requeue(queueItem, reason) {
    const requeued = this.queueManager.enqueue({
      project: queueItem.project,
      workflow: queueItem.workflow,
      objective: queueItem.objective,
      priority: queueItem.priority,
      criticidade: queueItem.criticidade,
      payload: {
        ...queueItem.payload,
        recoveryOf: queueItem.queueId,
        recoveredExecutionId: queueItem.executionId,
        failUntilAttempt: 0
      }
    });

    return {
      originalQueueId: queueItem.queueId,
      requeuedQueueId: requeued.queueId,
      workflow: queueItem.workflow,
      project: queueItem.project,
      reason,
      status: "requeued",
      requeuedAt: new Date().toISOString()
    };
  }
}

module.exports = {
  AutomaticRequeueEngine
};
