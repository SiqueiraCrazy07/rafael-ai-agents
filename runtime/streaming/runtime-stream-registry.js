class RuntimeStreamRegistry {
  constructor() {
    this.channels = new Map();
    this.subscribers = new Map();
  }

  registerChannel(channel) {
    const record = {
      channelId: channel.channelId || `stream_channel_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      name: channel.name,
      topic: channel.topic || channel.name,
      source: channel.source || "runtime-streaming",
      readonly: true,
      permissions: channel.permissions || ["runtime:read"],
      createdAt: new Date().toISOString(),
      safetyMode: "readonly-safe-stream-channel"
    };
    this.channels.set(record.name, record);
    return record;
  }

  registerSubscriber(subscriber = {}) {
    const requestedChannels = subscriber.channels || [];
    const allowedChannels = requestedChannels.filter((channel) => this.channels.has(channel));
    const record = {
      subscriberId: subscriber.subscriberId || `stream_subscriber_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      clientType: subscriber.clientType || "local-dashboard",
      channels: allowedChannels,
      requestedChannels,
      readonly: true,
      permissions: subscriber.permissions || ["runtime:read"],
      connectedAt: new Date().toISOString(),
      status: allowedChannels.length > 0 ? "subscribed" : "no-authorized-channels",
      safetyMode: "readonly-safe-stream-subscriber"
    };
    this.subscribers.set(record.subscriberId, record);
    return record;
  }

  listChannels() {
    return [...this.channels.values()];
  }

  listSubscribers() {
    return [...this.subscribers.values()];
  }

  seedDefaultChannels() {
    return [
      "runtime.events",
      "runtime.telemetry",
      "runtime.replay",
      "runtime.recovery",
      "runtime.dashboard",
      "runtime.brokers",
      "runtime.transport",
      "runtime.replication",
      "runtime.queue"
    ].map((name) => this.registerChannel({
      name,
      topic: name,
      permissions: ["runtime:read"],
      source: "runtime-streaming-websocket-layer"
    }));
  }
}

module.exports = {
  RuntimeStreamRegistry
};
