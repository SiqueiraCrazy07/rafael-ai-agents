const fs = require("node:fs");
const path = require("node:path");

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function readJsonArray(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

class BrokerMessageStore {
  constructor({ rootDir = process.cwd(), adapterName = "file-broker" } = {}) {
    this.rootDir = rootDir;
    this.adapterName = adapterName;
    this.runtimeDir = path.join(rootDir, "runtime-data", "brokers", adapterName);
    this.memoryDir = path.join(rootDir, "memory", "brokers", adapterName);
    this.runtimeMessagesPath = path.join(this.runtimeDir, "messages.json");
    this.memoryMessagesPath = path.join(this.memoryDir, "messages.json");
  }

  initialize() {
    ensureDir(this.runtimeDir);
    ensureDir(this.memoryDir);
    for (const filePath of [this.runtimeMessagesPath, this.memoryMessagesPath]) {
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, "[]\n", "utf8");
      }
    }
    return {
      runtimeDir: this.runtimeDir,
      memoryDir: this.memoryDir,
      safetyMode: "readonly-safe-broker-message-store"
    };
  }

  append(message) {
    this.initialize();
    const runtimeMessages = readJsonArray(this.runtimeMessagesPath);
    const memoryMessages = readJsonArray(this.memoryMessagesPath);
    runtimeMessages.push(message);
    memoryMessages.push(message);
    fs.writeFileSync(this.runtimeMessagesPath, `${JSON.stringify(runtimeMessages, null, 2)}\n`, "utf8");
    fs.writeFileSync(this.memoryMessagesPath, `${JSON.stringify(memoryMessages, null, 2)}\n`, "utf8");
    return {
      runtimePath: this.runtimeMessagesPath,
      memoryPath: this.memoryMessagesPath,
      count: runtimeMessages.length,
      safetyMode: "readonly-safe-broker-store-append"
    };
  }

  list() {
    this.initialize();
    return readJsonArray(this.runtimeMessagesPath);
  }
}

module.exports = {
  BrokerMessageStore
};
