class RuntimeAckManager {
  ack(delivery, reason = "simulated-delivery-accepted") {
    return {
      ackId: `ack_${delivery.deliveryId}_${Date.now()}`,
      deliveryId: delivery.deliveryId,
      transportId: delivery.transportId,
      status: "acked",
      reason,
      timestamp: new Date().toISOString(),
      readonly: true,
      safetyMode: "readonly-safe-transport-ack"
    };
  }

  nack(delivery, reason = "simulated-delivery-rejected") {
    return {
      nackId: `nack_${delivery.deliveryId}_${Date.now()}`,
      deliveryId: delivery.deliveryId,
      transportId: delivery.transportId,
      status: "nacked",
      reason,
      timestamp: new Date().toISOString(),
      timeoutMetadata: {
        expiredAt: delivery.expiresAt,
        deliveryExpired: new Date(delivery.expiresAt).getTime() < Date.now()
      },
      deliveryExpirationMetadata: {
        ttlExpired: new Date(delivery.expiresAt).getTime() < Date.now(),
        recommendation: "plan-transport-retry-or-deadletter"
      },
      readonly: true,
      safetyMode: "readonly-safe-transport-nack"
    };
  }
}

module.exports = {
  RuntimeAckManager
};
