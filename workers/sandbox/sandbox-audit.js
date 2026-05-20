const fs = require("node:fs");
const path = require("node:path");

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

class SandboxAudit {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
  }

  persist(report) {
    const runtimeDir = path.join(this.rootDir, "runtime-data", "worker-sandbox");
    const memoryDir = path.join(this.rootDir, "memory", "worker-sandbox");
    ensureDir(runtimeDir);
    ensureDir(memoryDir);

    const reportId = String(report.sandboxReportId || "sandbox-report").replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `worker-sandbox-${timestampForFile()}-${reportId}.json`;
    const runtimePath = path.join(runtimeDir, filename);
    const memoryPath = path.join(memoryDir, filename);
    fs.writeFileSync(runtimePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(memoryPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

    return {
      runtimePath,
      memoryPath
    };
  }
}

module.exports = {
  SandboxAudit
};
