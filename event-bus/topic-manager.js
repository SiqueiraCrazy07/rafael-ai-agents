const DEFAULT_TOPICS = Object.freeze([
  "runtime.workflow",
  "runtime.worker",
  "runtime.scheduler",
  "runtime.autonomous",
  "runtime.database",
  "runtime.telemetry",
  "runtime.dashboard",
  "runtime.plugins",
  "runtime.connectors",
  "runtime.dead-letter"
]);

class TopicManager {
  constructor({ topics = DEFAULT_TOPICS } = {}) {
    this.topics = new Map();
    for (const topic of topics) {
      this.createTopic(topic, { system: true });
    }
  }

  createTopic(topic, metadata = {}) {
    if (!topic) {
      throw new Error("topic is required");
    }
    if (!this.topics.has(topic)) {
      this.topics.set(topic, {
        topic,
        createdAt: new Date().toISOString(),
        enabled: true,
        metadata
      });
    }
    return this.topics.get(topic);
  }

  hasTopic(topic) {
    return this.topics.has(topic) && this.topics.get(topic).enabled;
  }

  listTopics() {
    return [...this.topics.values()];
  }

  ensureTopic(topic) {
    if (!this.hasTopic(topic)) {
      return this.createTopic(topic, { createdBy: "runtime-event-bus" });
    }
    return this.topics.get(topic);
  }
}

module.exports = {
  DEFAULT_TOPICS,
  TopicManager
};
