class DistributedLeaseManager {
  constructor({ leaseTtlMs = 5000 } = {}) {
    this.leaseTtlMs = leaseTtlMs;
    this.leases = [];
  }

  createLease({ workflowId, executionId, nodeId, workerId, ownerId, createdAt = new Date() }) {
    const created = createdAt instanceof Date ? createdAt : new Date(createdAt);
    const lease = {
      leaseId: `distributed_lease_${workflowId}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      workflowId,
      executionId,
      nodeId,
      workerId,
      ownerId: ownerId || nodeId,
      status: "active",
      createdAt: created.toISOString(),
      expiresAt: new Date(created.getTime() + this.leaseTtlMs).toISOString(),
      readonly: true,
      safetyMode: "readonly-safe-distributed-lease"
    };
    this.leases.push(lease);
    return lease;
  }

  expireLease(leaseId, reason = "demo-expiration") {
    const lease = this.leases.find((item) => item.leaseId === leaseId);
    if (lease) {
      lease.status = "expired";
      lease.expiredAt = new Date().toISOString();
      lease.reason = reason;
    }
    return lease;
  }

  detectStaleLeases(now = new Date()) {
    return this.leases
      .filter((lease) => lease.status === "active" && new Date(lease.expiresAt).getTime() < now.getTime())
      .map((lease) => ({
        leaseId: lease.leaseId,
        workflowId: lease.workflowId,
        nodeId: lease.nodeId,
        workerId: lease.workerId,
        reason: "lease-expired",
        recoveryRecommendation: "release-lease-and-reroute-readonly-plan"
      }));
  }

  listLeases() {
    return [...this.leases];
  }
}

module.exports = {
  DistributedLeaseManager
};
