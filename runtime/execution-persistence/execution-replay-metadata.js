const { timestampForFile } = require("./execution-persistence-engine");

class ExecutionReplayMetadata {
  constructor({ engine }) {
    this.engine = engine;
  }

  prepareReplay(input) {
    const createdAt = input.createdAt || new Date().toISOString();
    const metadata = {
      replayMetadataId:
        input.replayMetadataId ||
        `execution_replay_${input.executionId || input.workflowId || input.correlationId}_${Date.now()}`,
      type: "execution-replay-metadata",
      workflowId: input.workflowId || null,
      executionId: input.executionId || null,
      correlationId: input.correlationId || null,
      createdAt,
      readonly: true,
      safetyMode: "readonly-safe-execution-replay",
      replayPlan: {
        mode: input.mode || "metadata-only",
        filters: {
          workflowId: input.workflowId || null,
          executionId: input.executionId || null,
          correlationId: input.correlationId || null
        },
        steps: [
          "read execution journal",
          "read checkpoints",
          "read failures",
          "read event bus metadata",
          "return replay context without mutating runtime"
        ]
      },
      source: input.source || "execution-replay-metadata"
    };

    metadata.persistence = this.engine.persistRecord(
      "execution_replay_metadata",
      metadata,
      {
        runtimeDir: this.engine.replayRuntimeDir,
        memoryDir: this.engine.replayMemoryDir
      },
      `${timestampForFile(new Date(createdAt))}-${metadata.replayMetadataId}.json`
    );
    return metadata;
  }
}

module.exports = {
  ExecutionReplayMetadata
};
