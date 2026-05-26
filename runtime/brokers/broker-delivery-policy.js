class BrokerDeliveryPolicy {
  evaluate({ message, consumer, attempt = 1 }) {
    const maxAttempts = Number(message.metadata?.retry?.maxAttempts || 3);
    const nackRequested = message.payload?.simulateNack === true;
    const expired = message.payload?.simulateExpired === true;
    const status = nackRequested || expired ? "nack" : "ack";
    return {
      deliveryPolicyId: `broker_delivery_policy_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      messageId: message.brokerMessageId,
      consumerId: consumer.consumerId,
      status,
      attempt,
      maxAttempts,
      retryMetadata: {
        retryEligible: status === "nack" && attempt < maxAttempts,
        nextAttempt: attempt + 1,
        retryDelayMs: expired ? 60000 : 30000,
        reason: expired ? "message-expired" : nackRequested ? "consumer-nack-simulation" : "delivery-acked"
      },
      dlqMetadata: {
        eligible: status === "nack",
        reason: expired ? "expired-message" : nackRequested ? "failed-delivery" : null
      },
      readonly: true,
      safetyMode: "readonly-safe-broker-delivery-policy"
    };
  }
}

module.exports = {
  BrokerDeliveryPolicy
};
