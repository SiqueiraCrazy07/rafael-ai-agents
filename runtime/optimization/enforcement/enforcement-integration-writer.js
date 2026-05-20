const fs = require("node:fs");
const path = require("node:path");

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

function writeEnforcementIntegrationReport(kind, report, rootDir = process.cwd()) {
  const runtimeDir = path.join(rootDir, "runtime-data", "enforcement-integration");
  const memoryDir = path.join(rootDir, "memory", "enforcement-integration");
  ensureDirectory(runtimeDir);
  ensureDirectory(memoryDir);

  const filename = `${kind}-enforcement-integration-${timestampForFile()}.json`;
  const runtimePath = path.join(runtimeDir, filename);
  const memoryPath = path.join(memoryDir, filename);

  fs.writeFileSync(runtimePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(memoryPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  return {
    runtimePath,
    memoryPath
  };
}

module.exports = {
  writeEnforcementIntegrationReport
};
