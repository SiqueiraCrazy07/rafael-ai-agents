class RuntimeDeadLetterQueue {
  collect({ deliveries = [], nacks = [], retryTransport }) {
    const retryDeliveryIds = new Set((retryTransport.retryPlans || []).map((plan) => plan.deliveryId));
    const nackDeliveryIds = new Set(nacks.map((nack) => nack.deliveryId));
    const deadLetters = deliveries
      .filter((delivery) => delivery.stale || (delivery.status === "delivery-blocked" && !retryDeliveryIds.has(delivery.deliveryId)))
      .map((delivery) => this.deadLetter(delivery, delivery.stale ? "expired-delivery" : "failed-delivery"));

    for (const delivery of deliveries.filter((item) => nackDeliveryIds.has(item.deliveryId) && item.stale)) {
      if (!deadLetters.some((item) => item.deliveryId === delivery.deliveryId)) {
        deadLetters.push(this.deadLetter(delivery, "nacked-stale-delivery"));
      }
    }

    return {
      deadLetterQueueId: `transport_dlq_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      totalDeadLetters: deadLetters.length,
      deadLetters,
      replayRecommendation: deadLetters.length > 0 ? "use-replay-safe-envelope-metadata-before-redelivery" : null,
      safetyMode: "readonly-safe-transport-deadletter"
    };
  }

  deadLetter(delivery, reason) {
    return {
      deadLetterId: `deadletter_${delivery.deliveryId}_${Date.now()}`,
      deliveryId: delivery.deliveryId,
      transportId: delivery.transportId,
      messageId: delivery.messageId,
      reason,
      transportFailureMetadata: {
        sourceNodeId: delivery.sourceNodeId,
        targetNodeId: delivery.targetNodeId,
        status: delivery.status,
        ackStatus: delivery.ackStatus,
        attempts: delivery.attempts
      },
      replayRecommendation: "replay-envelope-and-refresh-route-before-retry",
      createdAt: new Date().toISOString(),
      readonly: true,
      safetyMode: "readonly-safe-transport-deadletter-item"
    };
  }
}

module.exports = {
  RuntimeDeadLetterQueue
};
