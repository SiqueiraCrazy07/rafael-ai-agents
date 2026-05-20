class EventRouter {
  constructor({ topicManager }) {
    this.topicManager = topicManager;
    this.routes = new Map();
  }

  registerRoute({ eventType, topic, routingKey = "*" }) {
    if (!eventType || !topic) {
      throw new Error("eventType and topic are required");
    }
    this.topicManager.ensureTopic(topic);
    this.routes.set(eventType, { eventType, topic, routingKey });
    return this.routes.get(eventType);
  }

  route(input) {
    const route = this.routes.get(input.type);
    if (route) {
      return {
        topic: input.topic || route.topic,
        routingKey: input.routingKey || route.routingKey,
        matched: true
      };
    }
    if (input.topic && this.topicManager.hasTopic(input.topic)) {
      return {
        topic: input.topic,
        routingKey: input.routingKey || "*",
        matched: true
      };
    }
    return {
      topic: input.topic || "runtime.dead-letter",
      routingKey: input.routingKey || "unrouted",
      matched: false,
      reason: "no-route-found"
    };
  }

  listRoutes() {
    return [...this.routes.values()];
  }
}

module.exports = {
  EventRouter
};
