const { BrokerAdapter } = require("./broker-adapter");
const { BrokerMessageStore } = require("./broker-message-store");

class FileBrokerAdapter extends BrokerAdapter {
  constructor(options = {}) {
    super({ adapterName: "file-broker", readonly: true });
    this.store = options.store || new BrokerMessageStore({ rootDir: options.rootDir, adapterName: "file-broker" });
    this.initialization = this.store.initialize();
  }

  publish(message) {
    const normalized = this.normalizeMessage(message);
    this.messages.push(normalized);
    const persistence = this.store.append(normalized);
    return {
      adapter: this.adapterName,
      status: "published",
      message: normalized,
      durable: true,
      persistence,
      readonly: true,
      safetyMode: "readonly-safe-file-broker-publish"
    };
  }

  subscribe(topic, consumer) {
    const consumerRecord = {
      consumerId: consumer.consumerId || `file_consumer_${topic}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      topic,
      readonly: consumer.readonly !== false,
      enabled: consumer.enabled !== false,
      capabilities: consumer.capabilities || ["runtime-read"],
      createdAt: new Date().toISOString(),
      safetyMode: "readonly-safe-file-broker-consumer"
    };
    const existing = this.consumers.get(topic) || [];
    existing.push(consumerRecord);
    this.consumers.set(topic, existing);
    return consumerRecord;
  }

  ack(messageId, consumerId, reason = "file-message-acked") {
    const ack = {
      ackId: `file_broker_ack_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      adapter: this.adapterName,
      messageId,
      consumerId,
      status: "acked",
      reason,
      timestamp: new Date().toISOString(),
      readonly: true,
      safetyMode: "readonly-safe-file-broker-ack"
    };
    this.acks.push(ack);
    return ack;
  }

  nack(messageId, consumerId, reason = "file-message-nacked") {
    const nack = {
      nackId: `file_broker_nack_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      adapter: this.adapterName,
      messageId,
      consumerId,
      status: "nacked",
      reason,
      timestamp: new Date().toISOString(),
      readonly: true,
      safetyMode: "readonly-safe-file-broker-nack"
    };
    this.nacks.push(nack);
    return nack;
  }

  listMessages() {
    return this.store.list();
  }

  health() {
    return {
      ...super.health(),
      storage: this.initialization,
      durable: true
    };
  }
}

module.exports = {
  FileBrokerAdapter
};
