class WorkflowStabilityAnalyzer {
  analyze(executions) {
    const workflows = new Map();

    for (const execution of executions) {
      if (!workflows.has(execution.workflow)) {
        workflows.set(execution.workflow, {
          workflow: execution.workflow,
          project: execution.project,
          executions: 0,
          completed: 0,
          failed: 0,
          rolledBack: 0,
          retries: 0
        });
      }

      const record = workflows.get(execution.workflow);
      record.executions += 1;
      record.retries += execution.retries?.count || 0;
      if (execution.status === "completed") record.completed += 1;
      if (execution.status === "failed") record.failed += 1;
      if (execution.status === "rolled_back") record.rolledBack += 1;
    }

    return [...workflows.values()].map((record) => {
      const successRate = record.executions > 0 ? record.completed / record.executions : 0;
      const stabilityScore = Math.max(
        0,
        Math.round(successRate * 100 - record.rolledBack * 15 - record.retries * 5)
      );
      return {
        ...record,
        successRate,
        stabilityScore,
        status:
          stabilityScore >= 90
            ? "stable"
            : stabilityScore >= 70
              ? "watch"
              : "unstable"
      };
    });
  }
}

module.exports = {
  WorkflowStabilityAnalyzer
};
