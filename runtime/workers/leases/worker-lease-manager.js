const fs = require("node:fs");
const path = require("node:path");

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function writeJson(filePath, data) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

class WorkerLeaseManager {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.runtimeDir = options.runtimeDir || path.join(this.rootDir, "runtime-data", "leases");
    this.leaseTtlMs = options.leaseTtlMs || 60000;
    this.leases = new Map();
  }

  reserve(queueItem, worker, options = {}) {
    const now = options.now || new Date();
    const ttlMs = options.ttlMs || this.leaseTtlMs;
    const lease = {
      leaseId: `lease_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      queueId: queueItem.queueId,
      executionId: queueItem.executionId,
      workflow: queueItem.workflow,
      project: queueItem.project,
      workerId: worker.workerId,
      status: "active",
      reservedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
      renewedAt: null,
      releasedAt: null
    };

    this.leases.set(queueItem.queueId, lease);
    this.persistLease(lease);
    return lease;
  }

  renew(queueId, options = {}) {
    const lease = this.leases.get(queueId);
    if (!lease || lease.status !== "active") {
      return null;
    }

    const now = options.now || new Date();
    const ttlMs = options.ttlMs || this.leaseTtlMs;
    lease.renewedAt = now.toISOString();
    lease.expiresAt = new Date(now.getTime() + ttlMs).toISOString();
    this.persistLease(lease);
    return lease;
  }

  release(queueId, reason = "completed") {
    const lease = this.leases.get(queueId);
    if (!lease) {
      return null;
    }

    lease.status = "released";
    lease.releasedAt = new Date().toISOString();
    lease.releaseReason = reason;
    this.persistLease(lease);
    return lease;
  }

  detectExpired(now = new Date()) {
    const nowMs = now.getTime();
    const expired = [];

    for (const lease of this.leases.values()) {
      if (lease.status === "active" && new Date(lease.expiresAt).getTime() < nowMs) {
        lease.status = "expired";
        lease.expiredAt = now.toISOString();
        this.persistLease(lease);
        expired.push({ ...lease });
      }
    }

    return expired;
  }

  list() {
    return [...this.leases.values()].map((lease) => ({ ...lease }));
  }

  persistLease(lease) {
    writeJson(path.join(this.runtimeDir, `${lease.leaseId}.json`), lease);
  }
}

module.exports = {
  WorkerLeaseManager
};
