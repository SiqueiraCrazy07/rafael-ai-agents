const path = require("node:path");
const { safeReadJson } = require("./replay-audit");

class ReplayCheckpointLoader {
  constructor({ rootDir = process.cwd() } = {}) {
    this.rootDir = rootDir;
    this.memoryDir = path.join(rootDir, "memory", "execution-persistence", "checkpoints");
    this.runtimeDir = path.join(rootDir, "runtime-data", "execution-persistence", "checkpoints");
  }

  load(filters = {}) {
    const loaded = this.readFromDirectories([this.memoryDir, this.runtimeDir]);
    const checkpoints = this.applyFilters(loaded.records, filters).sort((left, right) =>
      String(left.createdAt || "").localeCompare(String(right.createdAt || ""))
    );
    return {
      checkpoints,
      total: checkpoints.length,
      latest: checkpoints.at(-1) || null,
      readErrors: loaded.readErrors,
      missingSources: loaded.missingSources,
      fallback: loaded.fallback
    };
  }

  readFromDirectories(directories) {
    const fs = require("node:fs");
    const recordsById = new Map();
    const readErrors = [];
    const missingSources = [];
    for (const directory of directories) {
      if (!fs.existsSync(directory)) {
        missingSources.push(directory);
        continue;
      }
      for (const file of fs.readdirSync(directory).filter((item) => item.endsWith(".json"))) {
        const filePath = path.join(directory, file);
        const read = safeReadJson(filePath);
        if (!read.ok) {
          readErrors.push({ path: filePath, error: read.error });
          continue;
        }
        if (read.data?.checkpointId) {
          recordsById.set(read.data.checkpointId, { ...read.data, sourcePath: filePath });
        }
      }
    }
    return {
      records: [...recordsById.values()],
      readErrors,
      missingSources,
      fallback: {
        safeMode: true,
        reason:
          readErrors.length || missingSources.length ? "partial-checkpoint-replay-read" : "checkpoint-replay-sources-readable"
      }
    };
  }

  applyFilters(records, { workflowId = null, executionId = null, correlationId = null } = {}) {
    return records.filter((record) => {
      if (workflowId && record.workflowId !== workflowId) return false;
      if (executionId && record.executionId !== executionId) return false;
      if (correlationId && record.correlationId !== correlationId) return false;
      return true;
    });
  }
}

module.exports = {
  ReplayCheckpointLoader
};
