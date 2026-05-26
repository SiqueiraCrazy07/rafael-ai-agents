const { BrokerAdapter } = require("./broker-adapter");

class InMemoryBrokerAdapter extends BrokerAdapter {
  constructor(options = {}) {
    super({ adapterName: "in-memory-broker", readonly: true });
    this.options = options;
  }

  publish(message) {
    const normalized = this.normalizeMessage(message);
    this.messages.push(normalized);
    return {
      adapter: this.adapterName,
      status: "published",
      message: normalized,
      durable: false,
      readonly: true,
      safetyMode: "readonly-safe-in-memory-broker-publish"
    };
  }

  subscribe(topic, consumer) {
    const consumerRecord = {
      consumerId: consumer.consumerId || `consumer_${topic}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      topic,
      readonly: consumer.readonly !== false,
      enabled: consumer.enabled !== false,
      capabilities: consumer.capabilities || ["runtime-read"],
      createdAt: new Date().toISOString(),
      safetyMode: "readonly-safe-broker-consumer"
    };
    const existing = this.consumers.get(topic) || [];
    existing.push(consumerRecord);
    this.consumers.set(topic, existing);
    return consumerRecord;
  }

  ack(messageId, consumerId, reason = "in-memory-message-acked") {
    const ack = {
      ackId: `broker_ack_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      adapter: this.adapterName,
      messageId,
      consumerId,
      status: "acked",
      reason,
      timestamp: new Date().toISOString(),
      readonly: true,
      safetyMode: "readonly-safe-broker-ack"
    };
    this.acks.push(ack);
    return ack;
  }

  nack(messageId, consumerId, reason = "in-memory-message-nacked") {
    const nack = {
      nackId: `broker_nack_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      adapter: this.adapterName,
      messageId,
      consumerId,
      status: "nacked",
      reason,
      timestamp: new Date().toISOString(),
      readonly: true,
      safetyMode: "readonly-safe-broker-nack"
    };
    this.nacks.push(nack);
    return nack;
  }

  listMessages() {
    return [...this.messages];
  }
}

module.exports = {
  InMemoryBrokerAdapter
};
