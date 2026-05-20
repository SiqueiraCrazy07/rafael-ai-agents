class EventSubscriber {
  constructor({ subscriptionId, topic, handler, routingKey = "*", maxRetries = 1, readonly = true }) {
    if (!subscriptionId) {
      throw new Error("subscriptionId is required");
    }
    if (!topic) {
      throw new Error("topic is required");
    }
    if (typeof handler !== "function") {
      throw new Error("handler must be a function");
    }
    this.subscriptionId = subscriptionId;
    this.topic = topic;
    this.routingKey = routingKey;
    this.handler = handler;
    this.maxRetries = maxRetries;
    this.readonly = readonly !== false;
    this.createdAt = new Date().toISOString();
  }

  matches(event) {
    if (this.topic !== "*" && this.topic !== event.topic) {
      return false;
    }
    return this.routingKey === "*" || this.routingKey === event.routingKey;
  }

  deliver(event) {
    return this.handler(event);
  }

  describe() {
    return {
      subscriptionId: this.subscriptionId,
      topic: this.topic,
      routingKey: this.routingKey,
      maxRetries: this.maxRetries,
      readonly: this.readonly,
      createdAt: this.createdAt
    };
  }
}

module.exports = {
  EventSubscriber
};
