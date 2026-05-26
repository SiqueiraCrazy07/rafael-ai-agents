class RuntimeDeliveryTracker {
  createDelivery({ envelope, route }) {
    const now = new Date().toISOString();
    return {
      deliveryId: `delivery_${envelope.transportId}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      transportId: envelope.transportId,
      messageId: envelope.messageId,
      envelopeId: envelope.envelopeId,
      sourceNodeId: envelope.sourceNodeId,
      targetNodeId: route.selectedNodeId,
      targetWorkerId: route.selectedWorkerId,
      status: route.selectedNodeId ? "delivered-simulated" : "delivery-blocked",
      ackStatus: "pending",
      nackStatus: null,
      attempts: 1,
      createdAt: now,
      lastAttemptAt: now,
      expiresAt: envelope.expiresAt,
      stale: false,
      route,
      readonly: true,
      safetyMode: "readonly-safe-delivery-tracking"
    };
  }

  detectStale(deliveries = [], now = new Date()) {
    return deliveries.map((delivery) => {
      const stale = new Date(delivery.expiresAt).getTime() < now.getTime() && delivery.ackStatus !== "acked";
      return {
        ...delivery,
        stale,
        status: stale ? "stale-delivery" : delivery.status,
        staleReason: stale ? "delivery-expired-before-ack" : null
      };
    });
  }
}

module.exports = {
  RuntimeDeliveryTracker
};
