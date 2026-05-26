class BrokerAdapter {
  constructor({ adapterName = "broker-adapter", readonly = true } = {}) {
    this.adapterName = adapterName;
    this.readonly = readonly;
    this.messages = [];
    this.consumers = new Map();
    this.acks = [];
    this.nacks = [];
  }

  publish() {
    throw new Error("publish must be implemented by broker adapter");
  }

  subscribe() {
    throw new Error("subscribe must be implemented by broker adapter");
  }

  ack() {
    throw new Error("ack must be implemented by broker adapter");
  }

  nack() {
    throw new Error("nack must be implemented by broker adapter");
  }

  health() {
    return {
      adapterName: this.adapterName,
      healthy: true,
      readonly: this.readonly,
      externalBroker: false,
      safetyMode: "readonly-safe-broker-adapter"
    };
  }

  normalizeMessage(message = {}) {
    const now = new Date().toISOString();
    return {
      brokerMessageId: message.brokerMessageId || `broker_message_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      topic: message.topic || "runtime.transport",
      key: message.key || message.workflowId || "runtime-message",
      payload: message.payload || {},
      metadata: {
        correlationId: message.correlationId || `broker_correlation_${Date.now()}`,
        executionId: message.executionId || null,
        workflowId: message.workflowId || "broker-demo-workflow",
        source: message.source || this.adapterName,
        retry: message.retry || { attempt: 1, maxAttempts: 3 },
        dlq: message.dlq || { eligible: true },
        publishedAt: now,
        readonly: true
      },
      readonly: true,
      destructiveActions: false,
      safetyMode: "readonly-safe-broker-message"
    };
  }
}

module.exports = {
  BrokerAdapter
};
