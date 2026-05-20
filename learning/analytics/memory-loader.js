const fs = require("node:fs");
const path = require("node:path");

function readJsonFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .map((file) => ({
      path: path.join(directory, file),
      data: JSON.parse(fs.readFileSync(path.join(directory, file), "utf8"))
    }));
}

class MemoryLoader {
  constructor(memoryRoot = path.resolve(process.cwd(), "memory")) {
    this.memoryRoot = memoryRoot;
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
      executions: readJsonFiles(path.join(this.memoryRoot, "executions"))
    };
  }
}

module.exports = {
  MemoryLoader
};
