const fs = require("node:fs");
const path = require("node:path");

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

class RuntimeContainerAudit {
  constructor({ rootDir = process.cwd() } = {}) {
    this.runtimeDir = path.join(rootDir, "runtime-data", "docker");
    this.memoryDir = path.join(rootDir, "memory", "docker");
    this.events = [];
  }

  record(event) {
    const auditEvent = {
      auditEventId: `container_audit_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      readonly: true,
      ...event
    };
    this.events.push(auditEvent);
    return auditEvent;
  }

  persist(report) {
    ensureDir(this.runtimeDir);
    ensureDir(this.memoryDir);
    const filename = `runtime-containerization-${timestampForFile()}-${report.containerizationDemoId}.json`;
    const runtimePath = path.join(this.runtimeDir, filename);
    const memoryPath = path.join(this.memoryDir, filename);
    fs.writeFileSync(runtimePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(memoryPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    return { runtimePath, memoryPath };
  }
}

module.exports = {
  RuntimeContainerAudit
};
