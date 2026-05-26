const fs = require("node:fs");
const path = require("node:path");

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

class WorkerProcessAudit {
  constructor({ rootDir = process.cwd() } = {}) {
    this.runtimeDir = path.join(rootDir, "runtime-data", "multiprocess-workers");
    this.memoryDir = path.join(rootDir, "memory", "multiprocess-workers");
  }

  persist(report) {
    ensureDir(this.runtimeDir);
    ensureDir(this.memoryDir);
    const filename = `multiprocess-workers-${timestampForFile()}-${report.multiprocessWorkerDemoId}.json`;
    const runtimePath = path.join(this.runtimeDir, filename);
    const memoryPath = path.join(this.memoryDir, filename);
    fs.writeFileSync(runtimePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(memoryPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    return {
      runtimePath,
      memoryPath,
      safetyMode: "readonly-safe-multiprocess-worker-audit"
    };
  }
}

module.exports = {
  WorkerProcessAudit
};
