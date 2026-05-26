const { BrokerAdapter } = require("../brokers/broker-adapter");
const { FileBrokerAdapter } = require("../brokers/file-broker-adapter");

class RedisStreamsAdapter extends BrokerAdapter {
  constructor({ rootDir = process.cwd(), enabled = process.env.REDIS_STREAMS_ENABLED === "true", readonly = true } = {}) {
    super({ adapterName: "redis-streams", readonly });
    this.rootDir = rootDir;
    this.enabled = enabled;
    this.localFallback = new FileBrokerAdapter({ rootDir });
    this.streams = new Map();
    this.pending = new Map();
  }

  isAvailable() {
    return this.enabled && this.readonly;
  }

  publish(message = {}) {
    const normalized = this.normalizeMessage({
      ...message,
      topic: message.stream || message.topic || "runtime.stream"
    });
    const stream = normalized.topic;
    const streamMessage = {
      ...normalized,
      redisStreamId: `${Date.now()}-0`,
      stream,
      metadata: {
        ...normalized.metadata,
        transport: message.transport || {},
        replaySafe: message.replaySafe || { replayable: true, reason: "redis-stream-message-is-readonly-metadata" }
      },
      safetyMode: "readonly-safe-redis-stream-message"
    };

    if (!this.isAvailable()) {
      const fallback = this.localFallback.publish({
        ...streamMessage,
        topic: stream
      });
      return {
        adapter: this.adapterName,
        status: "fallback-published",
        stream,
        message: streamMessage,
        redisAvailable: false,
        fallback,
        readonly: true,
        safetyMode: "readonly-safe-redis-stream-fallback-publish"
      };
    }

    const items = this.streams.get(stream) || [];
    items.push(streamMessage);
    this.streams.set(stream, items);
    return {
      adapter: this.adapterName,
      status: "published-metadata-only",
      stream,
      message: streamMessage,
      redisAvailable: true,
      fallback: null,
      readonly: true,
      safetyMode: "readonly-safe-redis-stream-publish"
    };
  }

  subscribe(stream, consumer = {}) {
    const record = {
      consumerId: consumer.consumerId || `redis_consumer_${stream}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      groupId: consumer.groupId || "runtime-readers",
      stream,
      capabilities: consumer.capabilities || ["runtime-read"],
      readonly: true,
      enabled: consumer.enabled !== false,
      createdAt: new Date().toISOString(),
      safetyMode: "readonly-safe-redis-stream-consumer"
    };
    const existing = this.consumers.get(stream) || [];
    existing.push(record);
    this.consumers.set(stream, existing);
    return record;
  }

  ack(messageId, consumerId, reason = "redis-stream-message-acked") {
    const ack = {
      ackId: `redis_ack_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      messageId,
      consumerId,
      status: "acked",
      reason,
      redisCommandExecuted: false,
      timestamp: new Date().toISOString(),
      readonly: true,
      safetyMode: "readonly-safe-redis-stream-ack"
    };
    this.acks.push(ack);
    return ack;
  }

  nack(messageId, consumerId, reason = "redis-stream-message-nacked") {
    const nack = {
      nackId: `redis_nack_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      messageId,
      consumerId,
      status: "nacked",
      reason,
      redisCommandExecuted: false,
      timestamp: new Date().toISOString(),
      readonly: true,
      safetyMode: "readonly-safe-redis-stream-nack"
    };
    this.nacks.push(nack);
    return nack;
  }

  listMessages(stream = null) {
    if (stream) {
      return this.streams.get(stream) || [];
    }
    return [...this.streams.values()].flat();
  }

  health() {
    return {
      ...super.health(),
      enabled: this.enabled,
      available: this.isAvailable(),
      externalBroker: true,
      redisConnectivity: this.isAvailable() ? "metadata-only-enabled" : "disabled-or-unavailable",
      fallbackAvailable: true,
      safetyMode: "readonly-safe-redis-stream-health"
    };
  }
}

module.exports = {
  RedisStreamsAdapter
};
