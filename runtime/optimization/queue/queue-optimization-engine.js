class QueueOptimizationEngine {
  optimize({ latestQueue, latestPredictive }) {
    const blocked = latestQueue?.results?.filter((result) => result.status === "blocked") || [];
    const failed = latestQueue?.results?.filter((result) => result.status === "failed") || [];
    const criticalWorkflows = new Set((latestPredictive?.criticalWorkflows || []).map((workflow) => workflow.workflow));

    return {
      optimizer: "queue-optimization",
      bottlenecks: [
        ...(blocked.length > 0
          ? [
              {
                type: "blocked-workflows",
                count: blocked.length,
                workflows: [...new Set(blocked.map((item) => item.workflow))],
                recommendation: "keep blocked workflows isolated from normal queue"
              }
            ]
          : []),
        ...(failed.length > 0
          ? [
              {
                type: "failed-items",
                count: failed.length,
                workflows: [...new Set(failed.map((item) => item.workflow))],
                recommendation: "route failed workflows to retry queue with backoff"
              }
            ]
          : [])
      ],
      priorityAdjustments: (latestQueue?.queueItems || []).map((item) => ({
        workflow: item.workflow,
        currentPriority: item.priority,
        recommendedPriority: criticalWorkflows.has(item.workflow) ? "p0-gated" : item.priority,
        reason: criticalWorkflows.has(item.workflow)
          ? "critical forecast requires gated priority lane"
          : "keep current priority"
      }))
    };
  }
}

module.exports = {
  QueueOptimizationEngine
};
