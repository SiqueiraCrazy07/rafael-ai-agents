class WorkflowRiskScorer {
  score({ incidentPatterns, workflowFailures }) {
    const risks = new Map();

    for (const [workflow, count] of Object.entries(incidentPatterns.byWorkflow || {})) {
      risks.set(workflow, {
        workflow,
        incidentCount: count,
        failureSignals: 0,
        riskScore: count * 20
      });
    }

    for (const failure of workflowFailures) {
      const record =
        risks.get(failure.workflow) ||
        {
          workflow: failure.workflow,
          incidentCount: 0,
          failureSignals: 0,
          riskScore: 0
        };
      record.failureSignals += 1;
      record.riskScore += 30 + (failure.rolledBack || 0) * 15 + (failure.retries || 0) * 5;
      risks.set(failure.workflow, record);
    }

    return [...risks.values()].map((record) => ({
      ...record,
      riskScore: Math.min(100, record.riskScore),
      status: record.riskScore >= 70 ? "critical" : record.riskScore >= 40 ? "elevated" : "normal"
    }));
  }
}

module.exports = {
  WorkflowRiskScorer
};
