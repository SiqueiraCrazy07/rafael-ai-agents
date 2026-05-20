class HealthScoreEngine {
  buildHealthReport({ analyzedEvents, agentHealth, workflowStability }) {
    const baseScore = 100;
    const score =
      baseScore -
      analyzedEvents.summary.failures * 8 -
      analyzedEvents.summary.rollbacks * 12 -
      analyzedEvents.summary.retries * 5;

    return {
      reportId: `health_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      platformHealthScore: Math.max(0, Math.min(100, score)),
      summary: analyzedEvents.summary,
      agents: agentHealth,
      workflows: workflowStability,
      status:
        score >= 90 ? "healthy" : score >= 75 ? "attention" : score >= 50 ? "degraded" : "critical"
    };
  }
}

module.exports = {
  HealthScoreEngine
};
