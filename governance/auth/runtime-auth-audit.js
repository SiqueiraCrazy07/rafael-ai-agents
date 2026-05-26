const fs = require("node:fs");
const path = require("node:path");

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

class RuntimeAuthAudit {
  constructor({ rootDir = process.cwd() } = {}) {
    this.rootDir = rootDir;
    this.runtimeDir = path.join(rootDir, "runtime-data", "auth");
    this.memoryDir = path.join(rootDir, "memory", "auth");
    this.events = [];
  }

  record(event) {
    const auditEvent = {
      auditEventId: `auth_audit_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      readonly: true,
      ...event
    };
    this.events.push(auditEvent);
    return auditEvent;
  }

  deniedOperations() {
    return this.events.filter((event) => event.status === "denied" || event.allowed === false);
  }

  persist(report) {
    ensureDir(this.runtimeDir);
    ensureDir(this.memoryDir);
    const filename = `runtime-auth-${timestampForFile()}-${report.authDemoId || report.authReportId}.json`;
    const runtimePath = path.join(this.runtimeDir, filename);
    const memoryPath = path.join(this.memoryDir, filename);
    fs.writeFileSync(runtimePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(memoryPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    return { runtimePath, memoryPath };
  }
}

module.exports = {
  RuntimeAuthAudit
};
