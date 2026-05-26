class RuntimeRetryTransport {
  plan({ deliveries = [], nacks = [], staleDeliveries = [] }) {
    const retryCandidates = [
      ...deliveries.filter((delivery) => delivery.status === "delivery-blocked"),
      ...staleDeliveries.filter((delivery) => delivery.stale),
      ...nacks.map((nack) => deliveries.find((delivery) => delivery.deliveryId === nack.deliveryId)).filter(Boolean)
    ];
    const seen = new Set();
    const retryPlans = retryCandidates.filter((delivery) => {
      if (seen.has(delivery.deliveryId)) {
        return false;
      }
      seen.add(delivery.deliveryId);
      return true;
    }).map((delivery, index) => {
      const delayMs = delivery.stale ? 60000 : 30000;
      return {
        retryPlanId: `transport_retry_${Date.now()}_${index}`,
        deliveryId: delivery.deliveryId,
        transportId: delivery.transportId,
        messageId: delivery.messageId,
        attempt: Number(delivery.attempts || 1) + 1,
        retryDelayMs: delayMs,
        scheduledAt: new Date(Date.now() + delayMs).toISOString(),
        classification: delivery.stale ? "stale-delivery-retry" : "delivery-failure-retry",
        recoveryRecommendation: "retry-through-healthy-node-after-routing-refresh",
        escalationRecommendation: delivery.stale ? "human-gate-if-second-stale-delivery" : null,
        executeRetry: false,
        safetyMode: "readonly-safe-transport-retry"
      };
    });

    return {
      retryTransportId: `retry_transport_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      retryPlans,
      totalRetryPlans: retryPlans.length,
      readonly: true,
      executeRetry: false,
      safetyMode: "readonly-safe-retry-transport"
    };
  }
}

module.exports = {
  RuntimeRetryTransport
};
