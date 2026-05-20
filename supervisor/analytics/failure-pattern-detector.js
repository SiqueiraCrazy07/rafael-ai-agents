class FailurePatternDetector {
  detect({ analyzedEvents, executions }) {
    const patterns = [];

    for (const failure of analyzedEvents.failures) {
      patterns.push({
        type: "runtime-failure-signal",
        executionId: failure.executionId,
        workflow: failure.workflow,
        project: failure.project,
        severity: failure.type === "rollback_triggered" ? "high" : "medium",
        evidence: failure.type || `${failure.previousStatus}->${failure.nextStatus}`
      });
    }

    for (const execution of executions) {
      if (execution.status === "rolled_back") {
        patterns.push({
          type: "rollback-completed",
          executionId: execution.executionId,
          workflow: execution.workflow,
          project: execution.project,
          severity: "high",
          evidence: "execution final status rolled_back"
        });
      }
    }

    return patterns;
  }
}

module.exports = {
  FailurePatternDetector
};
