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

class PredictiveMemoryLoader {
  constructor(rootDir = process.cwd()) {
    this.rootDir = rootDir;
    this.memoryRoot = path.join(rootDir, "memory");
  }

  load() {
    const recoveryFiles = readJsonFiles(path.join(this.memoryRoot, "recovery"));

    return {
      incidents: readJsonFiles(path.join(this.memoryRoot, "incidents", "generated")),
      healthReports: readJsonFiles(path.join(this.memoryRoot, "health")),
      workflowReports: readJsonFiles(path.join(this.memoryRoot, "workflows")),
      recoveryRecommendations: recoveryFiles.filter((item) => item.data.action),
      runtimeRecoveries: recoveryFiles.filter((item) => item.data.recoveryId),
      routingDecisions: readJsonFiles(path.join(this.memoryRoot, "routing-decisions")),
      executions: readJsonFiles(path.join(this.memoryRoot, "executions")),
      queueReports: readJsonFiles(path.join(this.memoryRoot, "queue")),
      policyDecisions: readJsonFiles(path.join(this.memoryRoot, "policies")),
      predictiveReports: readJsonFiles(path.join(this.memoryRoot, "predictive"))
    };
  }
}

module.exports = {
  PredictiveMemoryLoader
};
