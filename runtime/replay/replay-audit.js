const fs = require("node:fs");
const path = require("node:path");

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return filePath;
}

function safeReadJson(filePath) {
  try {
    return {
      ok: true,
      data: JSON.parse(fs.readFileSync(filePath, "utf8"))
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message
    };
  }
}

class ReplayAudit {
  constructor({ rootDir = process.cwd() } = {}) {
    this.rootDir = rootDir;
    this.runtimeDir = path.join(rootDir, "runtime-data", "replay");
    this.memoryDir = path.join(rootDir, "memory", "replay");
  }

  initialize() {
    ensureDir(this.runtimeDir);
    ensureDir(this.memoryDir);
    return {
      runtimeDir: this.runtimeDir,
      memoryDir: this.memoryDir,
      safetyMode: "readonly-safe-workflow-replay"
    };
  }

  record(report) {
    this.initialize();
    const filename = `workflow-replay-${timestampForFile()}-${report.replayId}.json`;
    return {
      runtimePath: writeJson(path.join(this.runtimeDir, filename), report),
      memoryPath: writeJson(path.join(this.memoryDir, filename), report)
    };
  }
}

module.exports = {
  ReplayAudit,
  ensureDir,
  safeReadJson,
  timestampForFile,
  writeJson
};
