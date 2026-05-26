class RedisStreamGroupManager {
  constructor() {
    this.groups = new Map();
  }

  registerGroup({ stream, groupId, owner = "runtime-redis-integration" }) {
    const record = {
      groupId,
      stream,
      owner,
      consumers: [],
      pending: [],
      createdAt: new Date().toISOString(),
      readonly: true,
      safetyMode: "readonly-safe-redis-stream-group"
    };
    this.groups.set(`${stream}:${groupId}`, record);
    return record;
  }

  registerConsumer({ stream, groupId, consumerId, nodeId = "runtime-node-a" }) {
    const key = `${stream}:${groupId}`;
    const group = this.groups.get(key) || this.registerGroup({ stream, groupId });
    const consumer = {
      consumerId,
      nodeId,
      ownership: "metadata-only",
      pendingCount: 0,
      registeredAt: new Date().toISOString(),
      readonly: true,
      safetyMode: "readonly-safe-redis-stream-group-consumer"
    };
    group.consumers.push(consumer);
    return consumer;
  }

  recordPending({ stream, groupId, delivery }) {
    const key = `${stream}:${groupId}`;
    const group = this.groups.get(key) || this.registerGroup({ stream, groupId });
    const pending = {
      pendingId: `redis_pending_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      messageId: delivery.messageId,
      redisStreamId: delivery.redisStreamId,
      consumerId: delivery.consumerId,
      status: delivery.status,
      idleMs: delivery.stale ? 60000 : 0,
      readonly: true,
      safetyMode: "readonly-safe-redis-pending"
    };
    group.pending.push(pending);
    return pending;
  }

  listGroups() {
    return [...this.groups.values()];
  }
}

module.exports = {
  RedisStreamGroupManager
};
