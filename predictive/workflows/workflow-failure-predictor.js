class WorkflowFailurePredictor {
  predict(memory) {
    const byWorkflow = new Map();

    for (const incident of memory.incidents) {
      const workflow = incident.data.workflow || "unknown";
      const current = byWorkflow.get(workflow) || {
        workflow,
        incidents: 0,
        highSeverity: 0,
        mediumSeverity: 0,
        rollbackSignals: 0,
        retrySignals: 0
      };
      current.incidents += 1;
      if (incident.data.severity === "high") {
        current.highSeverity += 1;
      }
      if (incident.data.severity === "medium") {
        current.mediumSeverity += 1;
      }
      if ((incident.data.evidence || []).some((entry) => String(entry).includes("rollback"))) {
        current.rollbackSignals += 1;
      }
      byWorkflow.set(workflow, current);
    }

    for (const report of memory.workflowReports) {
      for (const workflow of Array.isArray(report.data) ? report.data : []) {
        const current = byWorkflow.get(workflow.workflow) || {
          workflow: workflow.workflow,
          incidents: 0,
          highSeverity: 0,
          mediumSeverity: 0,
          rollbackSignals: 0,
          retrySignals: 0
        };
        current.stabilityScore = Math.min(current.stabilityScore ?? 100, workflow.stabilityScore ?? 100);
        current.status = workflow.status;
        current.retrySignals += workflow.retries || 0;
        current.rollbacks = (current.rollbacks || 0) + (workflow.rolledBack || 0);
        byWorkflow.set(workflow.workflow, current);
      }
    }

    return [...byWorkflow.values()]
      .map((workflow) => {
        const score = Math.min(
          100,
          workflow.incidents * 8 +
            workflow.highSeverity * 12 +
            workflow.rollbackSignals * 15 +
            workflow.retrySignals * 10 +
            (workflow.rollbacks || 0) * 20 +
            Math.max(0, 60 - (workflow.stabilityScore ?? 100))
        );

        return {
          ...workflow,
          failureProbability: score,
          forecast:
            score >= 80 ? "critical" : score >= 60 ? "high" : score >= 35 ? "elevated" : "normal"
        };
      })
      .sort((left, right) => right.failureProbability - left.failureProbability);
  }
}

module.exports = {
  WorkflowFailurePredictor
};
