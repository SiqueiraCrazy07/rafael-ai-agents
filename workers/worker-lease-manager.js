const { stableId } = require("./worker-execution-context");

class WorkerLeaseManager {
  constructor({ ttlMs = 10000 } = {}) {
    this.ttlMs = ttlMs;
    this.leases = new Map();
  }

  acquireLease(job, worker, options = {}) {
    const now = options.now || new Date();
    const ttlMs = options.ttlMs || this.ttlMs;
    const lease = {
      leaseId: stableId(`lease_${worker.workerId}_${job.workflowId || job.jobId}`),
      workflowId: job.workflowId || job.workflow || job.jobId,
      jobId: job.jobId || job.workflowId,
      workerId: worker.workerId,
      status: "active",
      acquiredAt: now.toISOString(),
      renewedAt: null,
      expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
      ttlMs,
      safetyMode: "readonly-safe-lease-lock"
    };
    this.leases.set(lease.leaseId, lease);
    return { ...lease };
  }

  renewLease(leaseId, options = {}) {
    const lease = this.leases.get(leaseId);
    if (!lease || lease.status !== "active") {
      return null;
    }
    const now = options.now || new Date();
    const ttlMs = options.ttlMs || lease.ttlMs || this.ttlMs;
    lease.renewedAt = now.toISOString();
    lease.expiresAt = new Date(now.getTime() + ttlMs).toISOString();
    return { ...lease };
  }

  releaseLease(leaseId, status = "released") {
    const lease = this.leases.get(leaseId);
    if (!lease) {
      return null;
    }
    lease.status = status;
    lease.releasedAt = new Date().toISOString();
    return { ...lease };
  }

  expireLeases(now = new Date()) {
    const expired = [];
    for (const lease of this.leases.values()) {
      if (lease.status === "active" && new Date(lease.expiresAt).getTime() <= now.getTime()) {
        lease.status = "expired";
        lease.expiredAt = now.toISOString();
        expired.push({ ...lease });
      }
    }
    return expired;
  }

  activeLeases() {
    return [...this.leases.values()].filter((lease) => lease.status === "active").map((lease) => ({ ...lease }));
  }

  listLeases() {
    return [...this.leases.values()].map((lease) => ({ ...lease }));
  }
}

module.exports = {
  WorkerLeaseManager
};
