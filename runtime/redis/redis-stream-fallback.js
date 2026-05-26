const { FileBrokerAdapter } = require("../brokers/file-broker-adapter");
const { InMemoryBrokerAdapter } = require("../brokers/in-memory-broker-adapter");

class RedisStreamFallback {
  constructor({ rootDir = process.cwd() } = {}) {
    this.fileBroker = new FileBrokerAdapter({ rootDir });
    this.inMemoryBroker = new InMemoryBrokerAdapter();
  }

  choose({ redisHealth }) {
    if (redisHealth.available && !redisHealth.unhealthy) {
      return {
        selected: "redis-streams",
        fallbackUsed: false,
        reason: "redis-streams-available",
        safetyMode: "readonly-safe-redis-fallback"
      };
    }
    const fileHealth = this.fileBroker.health();
    return {
      selected: fileHealth.healthy ? "file-broker" : "in-memory-broker",
      fallbackUsed: true,
      reason: redisHealth.reason || "redis-unavailable",
      fallbackBrokerHealth: fileHealth.healthy ? fileHealth : this.inMemoryBroker.health(),
      preserveRuntime: true,
      safetyMode: "readonly-safe-redis-fallback"
    };
  }
}

module.exports = {
  RedisStreamFallback
};
