class BrokerFallbackManager {
  choose({ preferredAdapter, adapters = [] }) {
    const preferred = adapters.find((adapter) => adapter.adapterName === preferredAdapter);
    if (preferred) {
      return {
        selectedAdapter: preferred.adapterName,
        fallbackUsed: false,
        reason: "preferred-adapter-available",
        safetyMode: "readonly-safe-broker-fallback"
      };
    }
    const fileAdapter = adapters.find((adapter) => adapter.adapterName === "file-broker");
    const memoryAdapter = adapters.find((adapter) => adapter.adapterName === "in-memory-broker");
    const selected = fileAdapter || memoryAdapter || null;
    return {
      selectedAdapter: selected?.adapterName || null,
      fallbackUsed: true,
      reason: selected ? "preferred-adapter-unavailable" : "no-local-adapter-available",
      blockedExternalAdapters: ["redis-streams", "kafka", "nats", "rabbitmq"],
      safetyMode: "readonly-safe-broker-fallback"
    };
  }
}

module.exports = {
  BrokerFallbackManager
};
