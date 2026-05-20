class OrchestrationLeaseManager {
  constructor(options = {}) {
    this.defaultTtlMs = options.defaultTtlMs || 30000;
    this.leases = [];
    this.locks = new Map();
  }

  createLease(worker, queueItem, options = {}) {
    const now = options.now || new Date();
    const ttlMs = options.ttlMs || this.defaultTtlMs;
    const lockKey = queueItem.queueId || queueItem.executionId || queueItem.workflow;

    if (this.locks.has(lockKey)) {
      return {
        created: false,
        reason: "worker-lock-already-held",
        blockedBy: this.locks.get(lockKey)
      };
    }

    const lease = {
      leaseId: `orchestration_lease_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      workerId: worker.workerId,
      queueId: queueItem.queueId,
      executionId: queueItem.executionId,
      workflow: queueItem.workflow,
      project: queueItem.project || "platform",
      status: "active",
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
      renewedAt: null,
      lockKey
    };

    this.leases.push(lease);
    this.locks.set(lockKey, {
      leaseId: lease.leaseId,
      workerId: worker.workerId,
      queueId: queueItem.queueId,
      lockedAt: lease.createdAt
    });

    return {
      created: true,
      lease
    };
  }

  renewLease(leaseId, options = {}) {
    const lease = this.leases.find((candidate) => candidate.leaseId === leaseId);
    if (!lease || lease.status !== "active") {
      return {
        renewed: false,
        reason: "lease-not-active"
      };
    }

    const now = options.now || new Date();
    const ttlMs = options.ttlMs || this.defaultTtlMs;
    lease.renewedAt = now.toISOString();
    lease.expiresAt = new Date(now.getTime() + ttlMs).toISOString();

    return {
      renewed: true,
      lease: { ...lease }
    };
  }

  releaseLease(leaseId, reason = "completed") {
    const lease = this.leases.find((candidate) => candidate.leaseId === leaseId);
    if (!lease) {
      return {
        released: false,
        reason: "lease-not-found"
      };
    }

    lease.status = "released";
    lease.releasedAt = new Date().toISOString();
    lease.releaseReason = reason;
    this.locks.delete(lease.lockKey);

    return {
      released: true,
      lease: { ...lease }
    };
  }

  expireLeases(now = new Date()) {
    const expired = [];
    for (const lease of this.leases) {
      if (lease.status === "active" && Date.parse(lease.expiresAt) <= now.getTime()) {
        lease.status = "expired";
        lease.expiredAt = now.toISOString();
        this.locks.delete(lease.lockKey);
        expired.push({ ...lease });
      }
    }
    return expired;
  }

  detectOrphans(executionResults = []) {
    const finishedExecutionIds = new Set(executionResults.map((result) => result.executionId));
    return this.leases
      .filter((lease) => lease.status === "active" && !finishedExecutionIds.has(lease.executionId))
      .map((lease) => ({
        leaseId: lease.leaseId,
        workerId: lease.workerId,
        queueId: lease.queueId,
        executionId: lease.executionId,
        workflow: lease.workflow,
        reason: "active-lease-without-completed-execution"
      }));
  }

  list() {
    return this.leases.map((lease) => ({ ...lease }));
  }
}

module.exports = {
  OrchestrationLeaseManager
};
