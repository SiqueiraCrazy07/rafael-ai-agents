class ExecutionHistoryManager {
  constructor({ storage } = {}) {
    this.storage = storage;
  }

  buildTimeline(execution) {
    const logs = execution.logs.map((log) => ({
      timestamp: log.timestamp,
      type: "log",
      event: log.event,
      level: log.level,
      message: log.message
    }));

    const checkpoints = execution.checkpoints.map((checkpoint) => ({
      timestamp: checkpoint.createdAt,
      type: "checkpoint",
      event: "checkpoint_created",
      checkpointId: checkpoint.checkpointId,
      status: checkpoint.status,
      message: checkpoint.summary
    }));

    return [...logs, ...checkpoints].sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp)
    );
  }

  createHistory(execution) {
    return {
      executionId: execution.executionId,
      workflow: execution.workflow,
      project: execution.project,
      agents: execution.agents,
      status: execution.status,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      retries: execution.retries,
      timeline: this.buildTimeline(execution),
      outputs: execution.outputs,
      risks: execution.risks,
      replay: {
        supported: false,
        reason: "Runtime Engine V1 stores enough timeline metadata for future replay, but does not re-execute workflows yet."
      }
    };
  }

  async saveHistory(execution) {
    const history = this.createHistory(execution);

    if (this.storage) {
      await this.storage.saveHistory(execution.executionId, history);
    }

    return history;
  }
}

module.exports = {
  ExecutionHistoryManager
};
