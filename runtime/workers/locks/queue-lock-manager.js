const fs = require("node:fs");
const path = require("node:path");

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function writeJson(filePath, data) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

class QueueLockManager {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.runtimeDir = options.runtimeDir || path.join(this.rootDir, "runtime-data", "locks");
    this.locks = new Map();
    this.history = [];
  }

  buildKey(queueItem) {
    return `${queueItem.project}:${queueItem.workflow}:${queueItem.queueId}`;
  }

  acquire(queueItem, worker) {
    const key = this.buildKey(queueItem);
    const existing = this.locks.get(key);

    if (existing && existing.status === "locked") {
      return {
        acquired: false,
        blockedBy: existing
      };
    }

    const lock = {
      lockId: `lock_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      key,
      queueId: queueItem.queueId,
      executionId: queueItem.executionId,
      workflow: queueItem.workflow,
      project: queueItem.project,
      workerId: worker.workerId,
      status: "locked",
      lockedAt: new Date().toISOString(),
      releasedAt: null
    };

    this.locks.set(key, lock);
    this.history.push(lock);
    this.persistLock(lock);

    return {
      acquired: true,
      lock
    };
  }

  release(queueItem, reason = "completed") {
    const key = this.buildKey(queueItem);
    const lock = this.locks.get(key);
    if (!lock) {
      return null;
    }

    lock.status = "released";
    lock.releaseReason = reason;
    lock.releasedAt = new Date().toISOString();
    this.persistLock(lock);
    return lock;
  }

  list() {
    return this.history.map((lock) => ({ ...lock }));
  }

  persistLock(lock) {
    writeJson(path.join(this.runtimeDir, `${lock.lockId}.json`), lock);
  }
}

module.exports = {
  QueueLockManager
};
