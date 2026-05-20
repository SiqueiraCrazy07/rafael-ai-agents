class AdaptiveRetryOptimizer {
  optimize({ latestQueue, latestPredictive }) {
    const retryItems = latestQueue?.retryItems || [];
    const criticalWorkflows = new Set((latestPredictive?.criticalWorkflows || []).map((item) => item.workflow));

    return {
      optimizer: "adaptive-retry",
      strategies: retryItems.map((item) => ({
        workflow: item.workflow,
        currentAttempts: item.attempts,
        currentMaxRetries: item.maxRetries,
        recommendedMaxRetries: criticalWorkflows.has(item.workflow) ? 0 : Math.min(item.maxRetries || 2, 2),
        backoff: criticalWorkflows.has(item.workflow) ? "manual-review" : "exponential-backoff",
        reason: criticalWorkflows.has(item.workflow)
          ? "critical workflow should not retry automatically"
          : "transient failure eligible for controlled retry"
      })),
      defaultStrategy: {
        maxRetries: latestPredictive?.runtimeRisk?.status === "critical" ? 1 : 2,
        backoff: "exponential-backoff-with-jitter"
      }
    };
  }
}

module.exports = {
  AdaptiveRetryOptimizer
};
