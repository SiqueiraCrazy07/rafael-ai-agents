class RedisStreamHealth {
  evaluate({ adapter, groups = [], streamMessages = [] }) {
    const pendingMessages = groups.flatMap((group) => group.pending || []);
    const lagByStream = streamMessages.reduce((acc, message) => {
      acc[message.stream] = (acc[message.stream] || 0) + 1;
      return acc;
    }, {});
    const unhealthy = !adapter.health().available || pendingMessages.some((item) => item.idleMs > 30000);
    return {
      redisHealthId: `redis_health_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      generatedAt: new Date().toISOString(),
      available: adapter.health().available,
      enabled: adapter.enabled,
      connectivity: adapter.health().redisConnectivity,
      streamLag: Object.entries(lagByStream).map(([stream, lag]) => ({
        stream,
        lag,
        status: lag > 5 ? "attention-required" : "normal"
      })),
      pendingMessages: {
        total: pendingMessages.length,
        stale: pendingMessages.filter((item) => item.idleMs > 30000).length,
        items: pendingMessages
      },
      unhealthy,
      reason: unhealthy ? "redis-disabled-or-stale-pending-detected" : "redis-streams-metadata-healthy",
      readonly: true,
      safetyMode: "readonly-safe-redis-stream-health"
    };
  }
}

module.exports = {
  RedisStreamHealth
};
