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

function readJsonDir(directory, idField = null) {
  if (!fs.existsSync(directory)) {
    return {
      records: [],
      readErrors: [],
      missing: true
    };
  }

  const byId = new Map();
  const readErrors = [];
  for (const file of fs.readdirSync(directory).filter((item) => item.endsWith(".json"))) {
    const filePath = path.join(directory, file);
    const read = safeReadJson(filePath);
    if (!read.ok) {
      readErrors.push({ path: filePath, error: read.error });
      continue;
    }
    const key = idField ? read.data?.[idField] : null;
    byId.set(key || `${filePath}:${read.data?.generatedAt || read.data?.timestamp || ""}`, {
      ...read.data,
      sourcePath: filePath
    });
  }

  return {
    records: [...byId.values()],
    readErrors,
    missing: false
  };
}

class RecoveryAudit {
  constructor({ rootDir = process.cwd() } = {}) {
    this.rootDir = rootDir;
    this.runtimeDir = path.join(rootDir, "runtime-data", "self-healing");
    this.memoryDir = path.join(rootDir, "memory", "self-healing");
  }

  initialize() {
    ensureDir(this.runtimeDir);
    ensureDir(this.memoryDir);
    return {
      runtimeDir: this.runtimeDir,
      memoryDir: this.memoryDir,
      safetyMode: "readonly-safe-self-healing"
    };
  }

  record(report) {
    this.initialize();
    const filename = `runtime-recovery-${timestampForFile()}-${report.recoverySessionId}.json`;
    return {
      runtimePath: writeJson(path.join(this.runtimeDir, filename), report),
      memoryPath: writeJson(path.join(this.memoryDir, filename), report)
    };
  }
}

module.exports = {
  RecoveryAudit,
  ensureDir,
  readJsonDir,
  safeReadJson,
  timestampForFile,
  writeJson
};
