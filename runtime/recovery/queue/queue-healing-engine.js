class QueueHealingEngine {
  constructor({ requeueEngine }) {
    this.requeueEngine = requeueEngine;
  }

  heal({ leaseRecoveries, queueItemsByQueueId }) {
    return leaseRecoveries
      .filter((recovery) => recovery.status === "recoverable")
      .map((recovery) => {
        const queueItem = queueItemsByQueueId.get(recovery.queueId);
        return this.requeueEngine.requeue(queueItem, "lease_expired");
      });
  }
}

module.exports = {
  QueueHealingEngine
};
