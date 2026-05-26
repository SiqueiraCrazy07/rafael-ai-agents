class RedisStreamConsumer {
  constructor({ adapter }) {
    this.adapter = adapter;
  }

  consume({ stream, groupId, consumerId, messages = [] }) {
    const consumer = this.adapter.subscribe(stream, { groupId, consumerId, capabilities: ["runtime-read", "queue-read"] });
    const deliveries = messages.map((message, index) => {
      const stale = Boolean(message.payload?.simulateStale);
      return {
        deliveryId: `redis_delivery_${Date.now()}_${index}`,
        stream,
        groupId: consumer.groupId,
        consumerId: consumer.consumerId,
        messageId: message.brokerMessageId,
        redisStreamId: message.redisStreamId,
        status: stale ? "stale-delivery" : "delivered",
        stale,
        attempts: Number(message.metadata?.retry?.attempt || 1),
        readonly: true,
        safetyMode: "readonly-safe-redis-stream-delivery"
      };
    });
    const acks = deliveries
      .filter((delivery) => !delivery.stale)
      .map((delivery) => this.adapter.ack(delivery.messageId, delivery.consumerId));
    const nacks = deliveries
      .filter((delivery) => delivery.stale)
      .map((delivery) => this.adapter.nack(delivery.messageId, delivery.consumerId, "stale-delivery-detected"));
    return { consumer, deliveries, acks, nacks };
  }
}

module.exports = {
  RedisStreamConsumer
};
