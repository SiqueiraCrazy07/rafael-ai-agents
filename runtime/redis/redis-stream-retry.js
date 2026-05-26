class RedisStreamRetry {
  plan({ deliveries = [], maxAttempts = 3 }) {
    const retryPlans = deliveries
      .filter((delivery) => delivery.status !== "delivered" || delivery.stale)
      .map((delivery) => {
        const nextAttempt = Number(delivery.attempts || 1) + 1;
        return {
          retryPlanId: `redis_retry_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
          stream: delivery.stream,
          messageId: delivery.messageId,
          redisStreamId: delivery.redisStreamId,
          consumerId: delivery.consumerId,
          nextAttempt,
          retryEligible: nextAttempt <= maxAttempts,
          delayedRetryMs: nextAttempt * 30000,
          replayRecommendation: "run-readonly-replay-before-redis-redelivery",
          dlqRecommendation: nextAttempt > maxAttempts ? "move-to-redis-dlq-metadata" : null,
          executeRetry: false,
          readonly: true,
          safetyMode: "readonly-safe-redis-stream-retry"
        };
      });
    return {
      retryPlanSetId: `redis_retry_set_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      retryPlans,
      totalRetryPlans: retryPlans.length,
      safetyMode: "readonly-safe-redis-retry-plan"
    };
  }
}

module.exports = {
  RedisStreamRetry
};
