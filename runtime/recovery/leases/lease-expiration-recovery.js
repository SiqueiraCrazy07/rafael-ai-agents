class LeaseExpirationRecovery {
  constructor({ leaseManager, lockManager }) {
    this.leaseManager = leaseManager;
    this.lockManager = lockManager;
  }

  recover({ expiredLeases, queueItemsByQueueId }) {
    return expiredLeases.map((lease) => {
      const queueItem = queueItemsByQueueId.get(lease.queueId);
      const releasedLock = queueItem
        ? this.lockManager.release(queueItem, "lease_expired_recovery")
        : null;

      return {
        recoveryId: `lease_recovery_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        type: "lease_expiration_recovery",
        queueId: lease.queueId,
        executionId: lease.executionId,
        workflow: lease.workflow,
        project: lease.project,
        workerId: lease.workerId,
        leaseId: lease.leaseId,
        lockReleased: Boolean(releasedLock),
        status: queueItem ? "recoverable" : "missing_queue_item",
        recoveredAt: new Date().toISOString()
      };
    });
  }
}

module.exports = {
  LeaseExpirationRecovery
};
