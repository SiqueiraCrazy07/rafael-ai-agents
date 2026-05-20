class RetryPatternAnalyzer {
  analyze({ analyzedEvents, executions }) {
    const retryExecutions = executions.filter((execution) => (execution.retries?.count || 0) > 0);

    return retryExecutions.map((execution) => ({
      executionId: execution.executionId,
      workflow: execution.workflow,
      project: execution.project,
      retries: execution.retries.count,
      maxRetries: execution.retries.max,
      exhausted: execution.retries.count >= execution.retries.max,
      risky: execution.retries.count >= Math.max(1, execution.retries.max - 1),
      retryEvents: analyzedEvents.retries.filter(
        (event) => event.executionId === execution.executionId
      ).length
    }));
  }
}

module.exports = {
  RetryPatternAnalyzer
};
