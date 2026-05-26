class ExecutionStateReader {
  constructor({ engine }) {
    this.engine = engine;
  }

  currentState({ workflowId = null, executionId = null, correlationId = null } = {}) {
    const history = this.history({ workflowId, executionId, correlationId });
    const latest = history.journal.at(-1) || null;
    return {
      workflowId: workflowId || latest?.workflowId || null,
      executionId: executionId || latest?.executionId || null,
      correlationId: correlationId || latest?.correlationId || null,
      status: latest?.status || "unknown",
      latest,
      checkpoint: history.checkpoints.at(-1) || null,
      failures: history.failures,
      fallback: history.fallback,
      readErrors: history.readErrors
    };
  }

  history({ workflowId = null, executionId = null, correlationId = null } = {}) {
    const journal = this.filter(this.engine.readCollection("journal").records, { workflowId, executionId, correlationId });
    const checkpoints = this.filter(this.engine.readCollection("checkpoints").records, {
      workflowId,
      executionId,
      correlationId
    });
    const failures = this.filter(this.engine.readCollection("failures").records, { workflowId, executionId, correlationId });
    const replay = this.filter(this.engine.readCollection("replay").records, { workflowId, executionId, correlationId });

    const collections = ["journal", "checkpoints", "failures", "replay"].map((kind) => this.engine.readCollection(kind));
    const readErrors = collections.flatMap((collection) => collection.readErrors);
    const missingSources = collections.flatMap((collection) => collection.missingSources);

    return {
      journal,
      checkpoints,
      failures,
      replay,
      readErrors,
      missingSources,
      fallback: {
        safeMode: true,
        reason: readErrors.length || missingSources.length ? "partial-execution-state-read" : "execution-state-readable"
      }
    };
  }

  filter(records, { workflowId, executionId, correlationId }) {
    return records.filter((record) => {
      if (workflowId && record.workflowId !== workflowId) return false;
      if (executionId && record.executionId !== executionId) return false;
      if (correlationId && record.correlationId !== correlationId) return false;
      return true;
    });
  }
}

module.exports = {
  ExecutionStateReader
};
