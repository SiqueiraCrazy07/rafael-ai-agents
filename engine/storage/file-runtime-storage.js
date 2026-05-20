const fs = require("node:fs/promises");
const path = require("node:path");

class FileRuntimeStorage {
  constructor(options = {}) {
    this.rootDir = options.rootDir || path.resolve(process.cwd(), "runtime-data");
    this.directories = {
      executions: path.join(this.rootDir, "executions"),
      checkpoints: path.join(this.rootDir, "checkpoints"),
      history: path.join(this.rootDir, "history"),
      events: path.join(this.rootDir, "events")
    };
  }

  async ensureReady() {
    await Promise.all(
      Object.values(this.directories).map((directory) =>
        fs.mkdir(directory, { recursive: true })
      )
    );
  }

  async writeJson(filePath, data) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  }

  async readJson(filePath) {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  }

  executionPath(executionId) {
    return path.join(this.directories.executions, `${executionId}.json`);
  }

  checkpointPath(executionId, checkpointId) {
    return path.join(this.directories.checkpoints, executionId, `${checkpointId}.json`);
  }

  historyPath(executionId) {
    return path.join(this.directories.history, `${executionId}.json`);
  }

  eventsPath(executionId) {
    return path.join(this.directories.events, `${executionId}.jsonl`);
  }

  async saveExecution(execution) {
    await this.ensureReady();
    await this.writeJson(this.executionPath(execution.executionId), execution);
    return execution;
  }

  async loadExecution(executionId) {
    return this.readJson(this.executionPath(executionId));
  }

  async saveCheckpoint(executionId, checkpoint) {
    await this.ensureReady();
    await this.writeJson(this.checkpointPath(executionId, checkpoint.checkpointId), checkpoint);
    return checkpoint;
  }

  async loadCheckpoint(executionId, checkpointId) {
    return this.readJson(this.checkpointPath(executionId, checkpointId));
  }

  async listCheckpoints(executionId) {
    const directory = path.join(this.directories.checkpoints, executionId);

    try {
      const files = await fs.readdir(directory);
      return files
        .filter((file) => file.endsWith(".json"))
        .map((file) => file.replace(/\.json$/, ""));
    } catch (error) {
      if (error.code === "ENOENT") {
        return [];
      }

      throw error;
    }
  }

  async appendEvent(executionId, event) {
    await this.ensureReady();
    const line = `${JSON.stringify(event)}\n`;
    await fs.appendFile(this.eventsPath(executionId), line, "utf8");
    return event;
  }

  async saveHistory(executionId, history) {
    await this.ensureReady();
    await this.writeJson(this.historyPath(executionId), history);
    return history;
  }

  async loadHistory(executionId) {
    return this.readJson(this.historyPath(executionId));
  }
}

module.exports = {
  FileRuntimeStorage
};
