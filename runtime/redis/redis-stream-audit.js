const fs = require("node:fs");
const path = require("node:path");

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

class RedisStreamAudit {
  constructor({ rootDir = process.cwd() } = {}) {
    this.runtimeDir = path.join(rootDir, "runtime-data", "redis");
    this.memoryDir = path.join(rootDir, "memory", "redis");
  }

  persist(report) {
    ensureDir(this.runtimeDir);
    ensureDir(this.memoryDir);
    const filename = `redis-streams-${timestampForFile()}-${report.redisStreamsDemoId}.json`;
    const runtimePath = path.join(this.runtimeDir, filename);
    const memoryPath = path.join(this.memoryDir, filename);
    fs.writeFileSync(runtimePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(memoryPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    return {
      runtimePath,
      memoryPath,
      safetyMode: "readonly-safe-redis-stream-audit"
    };
  }
}

module.exports = {
  RedisStreamAudit
};
