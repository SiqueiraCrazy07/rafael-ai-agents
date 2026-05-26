const { timestampForFile } = require("./execution-persistence-engine");

class ExecutionCheckpointStore {
  constructor({ engine }) {
    this.engine = engine;
  }

  saveCheckpoint(input) {
    const createdAt = input.createdAt || new Date().toISOString();
    const checkpoint = {
      checkpointId:
        input.checkpointId ||
        `execution_checkpoint_${input.executionId}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      type: "execution-checkpoint",
      workflowId: input.workflowId,
      workerId: input.workerId || null,
      executionId: input.executionId,
      correlationId: input.correlationId,
      createdAt,
      status: input.status || "checkpointed",
      checkpoint: input.checkpoint || {},
      consistencyMarker: {
        readonly: true,
        reason: input.reason || "execution-checkpoint",
        marker: input.marker || `marker_${input.executionId}_${Date.now()}`
      },
      safetyMode: input.safetyMode || "readonly-safe-execution-checkpoint",
      source: input.source || "execution-checkpoint-store"
    };

    checkpoint.persistence = this.engine.persistRecord(
      "execution_checkpoints",
      checkpoint,
      {
        runtimeDir: this.engine.checkpointRuntimeDir,
        memoryDir: this.engine.checkpointMemoryDir
      },
      `${timestampForFile(new Date(createdAt))}-${checkpoint.executionId}-${checkpoint.checkpointId}.json`
    );
    return checkpoint;
  }

  latestCheckpoint({ workflowId = null, executionId = null, correlationId = null } = {}) {
    const read = this.engine.readCollection("checkpoints");
    const matches = read.records.filter((checkpoint) => {
      if (workflowId && checkpoint.workflowId !== workflowId) return false;
      if (executionId && checkpoint.executionId !== executionId) return false;
      if (correlationId && checkpoint.correlationId !== correlationId) return false;
      return true;
    });

    return {
      checkpoint: matches.at(-1) || null,
      total: matches.length,
      readErrors: read.readErrors,
      missingSources: read.missingSources,
      fallback: read.fallback
    };
  }
}

module.exports = {
  ExecutionCheckpointStore
};
