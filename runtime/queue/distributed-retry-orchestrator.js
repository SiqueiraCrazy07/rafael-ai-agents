class DistributedRetryOrchestrator {
  plan({ partitions = [], backpressure }) {
    const retryItems = partitions.flatMap((partition) => partition.retryItems.map((item) => ({
      ...item,
      sourcePartitionId: partition.partitionId,
      sourceNodeId: partition.nodeId
    })));
    const retryStorm = backpressure.signals.some((signal) => signal.type === "retry-storm");

    const retryPlans = retryItems.map((item, index) => {
      const attempt = Number(item.nextAttempt || item.attempt || 2);
      const baseDelay = Number(item.retryDelayMs || 30000);
      const delayMs = retryStorm ? baseDelay * 2 : baseDelay;
      const eligible = attempt <= Number(item.maxRetries || 3);
      return {
        retryPlanId: `retry_plan_${Date.now()}_${index}`,
        workflowId: item.workflowId || item.workflow || item.jobId,
        jobId: item.jobId || item.queueItemId || null,
        attempt,
        eligible,
        classification: retryStorm ? "retry-storm-protected" : "standard-retry",
        delayMs,
        scheduledAt: new Date(Date.now() + delayMs).toISOString(),
        escalationRecommendation: eligible ? null : "human-gate-retry-limit-exceeded",
        sourcePartitionId: item.sourcePartitionId,
        sourceNodeId: item.sourceNodeId,
        safetyMode: "readonly-safe-retry-orchestration"
      };
    });

    return {
      retryOrchestrationId: `retry_orchestration_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      totalRetryItems: retryItems.length,
      retryStormDetected: retryStorm,
      retryPlans,
      recommendations: retryStorm
        ? ["increase retry delay", "protect critical workflows", "escalate repeated failures"]
        : ["continue controlled retry schedule"],
      safetyMode: "readonly-safe-distributed-retry"
    };
  }
}

module.exports = {
  DistributedRetryOrchestrator
};
