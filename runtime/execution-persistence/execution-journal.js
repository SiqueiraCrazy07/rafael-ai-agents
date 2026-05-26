const { timestampForFile } = require("./execution-persistence-engine");

class ExecutionJournal {
  constructor({ engine }) {
    this.engine = engine;
  }

  recordTransition(input) {
    const timestamp = input.timestamp || new Date().toISOString();
    const journal = {
      journalId:
        input.journalId ||
        `execution_journal_${input.executionId}_${input.status}_${Date.now()}_${Math.random()
          .toString(16)
          .slice(2, 8)}`,
      type: "execution-journal-entry",
      workflowId: input.workflowId,
      workerId: input.workerId || null,
      executionId: input.executionId,
      correlationId: input.correlationId,
      attempt: input.attempt || 1,
      timestamp,
      status: input.status,
      previousStatus: input.previousStatus || null,
      transition: {
        from: input.previousStatus || null,
        to: input.status,
        reason: input.reason || "execution-status-transition"
      },
      metadata: input.metadata || {},
      safetyMode: input.safetyMode || "readonly-safe-execution-journal",
      source: input.source || "execution-journal"
    };

    journal.persistence = this.engine.persistRecord(
      "execution_journal",
      journal,
      {
        runtimeDir: this.engine.journalRuntimeDir,
        memoryDir: this.engine.journalMemoryDir
      },
      `${timestampForFile(new Date(timestamp))}-${journal.executionId}-${journal.status}-${journal.journalId}.json`
    );
    return journal;
  }

  executionStarted(input) {
    return this.recordTransition({
      ...input,
      status: "started",
      previousStatus: input.previousStatus || "pending",
      reason: input.reason || "execution-started"
    });
  }

  executionCompleted(input) {
    return this.recordTransition({
      ...input,
      status: "completed",
      previousStatus: input.previousStatus || "running",
      reason: input.reason || "execution-completed"
    });
  }

  executionFailed(input) {
    return this.recordTransition({
      ...input,
      status: "failed",
      previousStatus: input.previousStatus || "running",
      reason: input.reason || "execution-failed"
    });
  }

  retryScheduled(input) {
    return this.recordTransition({
      ...input,
      status: "retrying",
      previousStatus: input.previousStatus || "failed",
      reason: input.reason || "retry-scheduled"
    });
  }
}

module.exports = {
  ExecutionJournal
};
