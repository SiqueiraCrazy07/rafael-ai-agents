class WorkerExecutionSimulator {
  run(worker, item) {
    worker.running += 1;

    const shouldFail = item.payload?.failUntilAttempt && item.attempts < item.payload.failUntilAttempt;
    const startedAt = new Date().toISOString();
    const durationMs = 15 + item.priority.length + item.workflow.length;

    worker.running -= 1;

    if (shouldFail) {
      return {
        executionId: item.executionId,
        queueId: item.queueId,
        workflow: item.workflow,
        project: item.project,
        workerId: worker.workerId,
        status: "failed",
        attempts: item.attempts,
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs,
        error: "simulated_transient_failure"
      };
    }

    return {
      executionId: item.executionId,
      queueId: item.queueId,
      workflow: item.workflow,
      project: item.project,
      workerId: worker.workerId,
      status: "completed",
      attempts: item.attempts,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs,
      output: {
        summary: "Distributed execution simulator completed the item."
      }
    };
  }
}

module.exports = {
  WorkerExecutionSimulator
};
