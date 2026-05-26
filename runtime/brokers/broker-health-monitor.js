class BrokerHealthMonitor {
  check(adapters = []) {
    const checks = adapters.map((adapter) => adapter.health());
    return {
      brokerHealthId: `broker_health_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      generatedAt: new Date().toISOString(),
      healthy: checks.every((check) => check.healthy),
      checks,
      futureAdapters: ["redis-streams", "kafka", "nats", "rabbitmq"],
      readiness: {
        externalBrokerConfigured: false,
        localFallbackAvailable: checks.some((check) => check.adapterName === "file-broker"),
        inMemoryFallbackAvailable: checks.some((check) => check.adapterName === "in-memory-broker")
      },
      safetyMode: "readonly-safe-broker-health"
    };
  }
}

module.exports = {
  BrokerHealthMonitor
};
