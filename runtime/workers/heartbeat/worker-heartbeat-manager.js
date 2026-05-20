const fs = require("node:fs");
const path = require("node:path");

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function writeJson(filePath, data) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

class WorkerHeartbeatManager {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.runtimeDir = options.runtimeDir || path.join(this.rootDir, "runtime-data", "workers");
    this.memoryDir = options.memoryDir || path.join(this.rootDir, "memory", "workers");
    this.heartbeats = new Map();
  }

  record(worker, options = {}) {
    const now = options.now || new Date();
    const heartbeat = {
      workerId: worker.workerId,
      status: worker.status,
      lastSeenAt: now.toISOString(),
      running: worker.running,
      capacity: worker.capacity,
      capabilities: worker.capabilities
    };

    this.heartbeats.set(worker.workerId, heartbeat);
    this.persistHeartbeat(heartbeat);
    return heartbeat;
  }

  list() {
    return [...this.heartbeats.values()];
  }

  detectStale({ now = Date.now(), staleAfterMs = 30000 } = {}) {
    return this.list().filter((heartbeat) => {
      const lastSeen = new Date(heartbeat.lastSeenAt).getTime();
      return now - lastSeen > staleAfterMs;
    });
  }

  persistHeartbeat(heartbeat) {
    const filename = `${heartbeat.workerId}.json`;
    writeJson(path.join(this.runtimeDir, filename), heartbeat);
    writeJson(path.join(this.memoryDir, filename), heartbeat);
  }
}

module.exports = {
  WorkerHeartbeatManager
};
