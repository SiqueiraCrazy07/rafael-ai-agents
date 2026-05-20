class ExecutionRecoveryEngine {
  constructor({ workerRegistry, workerSimulator, lockManager, leaseManager, heartbeatManager }) {
    this.workerRegistry = workerRegistry;
    this.workerSimulator = workerSimulator;
    this.lockManager = lockManager;
    this.leaseManager = leaseManager;
    this.heartbeatManager = heartbeatManager;
  }

  execute(queueManager) {
    const item = queueManager.dequeue();
    if (!item) {
      return null;
    }

    const worker = this.workerRegistry.findAvailable(item);
    if (!worker) {
      return {
        queueId: item.queueId,
        workflow: item.workflow,
        status: "waiting_worker",
        reason: "no healthy compatible worker available"
      };
    }

    const lease = this.leaseManager.reserve(item, worker);
    const lock = this.lockManager.acquire(item, worker);
    const duplicateAttempt = this.lockManager.acquire(item, { workerId: "duplicate-recovery-worker" });

    if (!lock.acquired) {
      return {
        queueId: item.queueId,
        workflow: item.workflow,
        status: "duplicate_blocked",
        reason: "recovery item already locked",
        blockedBy: lock.blockedBy.lockId
      };
    }

    const result = this.workerSimulator.run(worker, item);
    this.heartbeatManager.record(worker);
    this.leaseManager.release(item.queueId, result.status);
    this.lockManager.release(item, result.status);

    return {
      ...result,
      recoveryLeaseId: lease.leaseId,
      recoveryLockId: lock.lock.lockId,
      duplicateBlocked: !duplicateAttempt.acquired,
      duplicateBlockedBy: duplicateAttempt.blockedBy?.lockId || null
    };
  }
}

module.exports = {
  ExecutionRecoveryEngine
};
