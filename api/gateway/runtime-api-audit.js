const fs = require("node:fs");
const path = require("node:path");

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

class RuntimeApiAudit {
  constructor({ rootDir = process.cwd() } = {}) {
    this.runtimeDir = path.join(rootDir, "runtime-data", "api-gateway");
    this.memoryDir = path.join(rootDir, "memory", "api-gateway");
    this.events = [];
  }

  record(event) {
    const auditEvent = {
      auditEventId: `gateway_audit_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      readonly: true,
      ...event
    };
    this.events.push(auditEvent);
    return auditEvent;
  }

  summary() {
    return {
      totalRequests: this.events.filter((event) => event.type === "request").length,
      deniedRequests: this.events.filter((event) => event.status === "denied").length,
      rbacViolations: this.events.filter((event) => event.reason && event.reason.includes("permission")).length,
      tenantViolations: this.events.filter((event) => event.reason === "cross-tenant-access-denied").length,
      rateLimitViolations: this.events.filter((event) => event.reason === "tenant-rate-limit-exceeded").length
    };
  }

  persist(report) {
    ensureDir(this.runtimeDir);
    ensureDir(this.memoryDir);
    const filename = `runtime-api-gateway-${timestampForFile()}-${report.gatewayDemoId || report.gatewayReportId}.json`;
    const runtimePath = path.join(this.runtimeDir, filename);
    const memoryPath = path.join(this.memoryDir, filename);
    fs.writeFileSync(runtimePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(memoryPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    return { runtimePath, memoryPath };
  }
}

module.exports = {
  RuntimeApiAudit
};
