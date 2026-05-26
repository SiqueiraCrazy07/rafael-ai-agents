class BrokerConsumerRegistry {
  constructor() {
    this.consumers = [];
  }

  register({ adapterName, topic, consumerId, capabilities = ["runtime-read"], readonly = true }) {
    const consumer = {
      registryId: `broker_consumer_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      adapterName,
      topic,
      consumerId,
      capabilities,
      readonly,
      enabled: true,
      createdAt: new Date().toISOString(),
      safetyMode: "readonly-safe-broker-consumer-registry"
    };
    this.consumers.push(consumer);
    return consumer;
  }

  list() {
    return [...this.consumers];
  }
}

module.exports = {
  BrokerConsumerRegistry
};
