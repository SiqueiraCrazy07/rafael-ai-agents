const crypto = require("node:crypto");

function createCheckpointId() {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
  const suffix = crypto.randomBytes(3).toString("hex");
  return `chk_${timestamp}_${suffix}`;
}

class CheckpointManager {
  constructor({ storage } = {}) {
    this.storage = storage;
  }

  createCheckpoint(execution, { summary, artifacts = [], data = {} } = {}) {
    if (!summary) {
      throw new Error("checkpoint summary is required");
    }

    return {
      checkpointId: createCheckpointId(),
      executionId: execution.executionId,
      createdAt: new Date().toISOString(),
      status: execution.status,
      summary,
      artifacts,
      snapshot: {
        executionId: execution.executionId,
        workflow: execution.workflow,
        project: execution.project,
        agents: execution.agents,
        status: execution.status,
        retries: execution.retries,
        outputs: execution.outputs,
        risks: execution.risks,
        data
      }
    };
  }

  validateCheckpoint(checkpoint) {
    return Boolean(
      checkpoint &&
        checkpoint.checkpointId &&
        checkpoint.executionId &&
        checkpoint.createdAt &&
        checkpoint.status &&
        checkpoint.summary &&
        checkpoint.snapshot
    );
  }

  async saveCheckpoint(execution, checkpointInput) {
    const checkpoint = this.createCheckpoint(execution, checkpointInput);

    if (!this.validateCheckpoint(checkpoint)) {
      throw new Error("Invalid checkpoint");
    }

    execution.checkpoints.push({
      checkpointId: checkpoint.checkpointId,
      createdAt: checkpoint.createdAt,
      status: checkpoint.status,
      summary: checkpoint.summary,
      artifacts: checkpoint.artifacts
    });

    if (this.storage) {
      await this.storage.saveCheckpoint(execution.executionId, checkpoint);
      await this.storage.saveExecution(execution);
    }

    return checkpoint;
  }

  async loadCheckpoint(executionId, checkpointId) {
    if (!this.storage) {
      throw new Error("storage is required to load checkpoints");
    }

    return this.storage.loadCheckpoint(executionId, checkpointId);
  }

  async listCheckpoints(executionId) {
    if (!this.storage) {
      return [];
    }

    return this.storage.listCheckpoints(executionId);
  }
}

module.exports = {
  CheckpointManager,
  createCheckpointId
};
