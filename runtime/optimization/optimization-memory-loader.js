const fs = require("node:fs");
const path = require("node:path");

function readJsonFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const fullPath = path.join(directory, file);
      return {
        path: fullPath,
        mtimeMs: fs.statSync(fullPath).mtimeMs,
        data: JSON.parse(fs.readFileSync(fullPath, "utf8"))
      };
    })
    .sort((left, right) => left.mtimeMs - right.mtimeMs);
}

class OptimizationMemoryLoader {
  constructor(rootDir = process.cwd()) {
    this.rootDir = rootDir;
    this.memoryRoot = path.join(rootDir, "memory");
  }

  load() {
    const recoveryFiles = readJsonFiles(path.join(this.memoryRoot, "recovery"));

    return {
      healthReports: readJsonFiles(path.join(this.memoryRoot, "health")),
      incidents: readJsonFiles(path.join(this.memoryRoot, "incidents", "generated")),
      queueReports: readJsonFiles(path.join(this.memoryRoot, "queue")),
      predictiveReports: readJsonFiles(path.join(this.memoryRoot, "predictive")),
      proactiveReports: readJsonFiles(path.join(this.memoryRoot, "proactive")),
      recoveryRecommendations: recoveryFiles.filter((item) => item.data.action),
      runtimeRecoveries: recoveryFiles.filter((item) => item.data.recoveryId),
      policies: readJsonFiles(path.join(this.memoryRoot, "policies")),
      optimizations: readJsonFiles(path.join(this.memoryRoot, "optimization"))
    };
  }
}

module.exports = {
  OptimizationMemoryLoader
};
