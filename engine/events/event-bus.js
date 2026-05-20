const EVENT_TYPES = Object.freeze({
  EXECUTION_STARTED: "execution_started",
  EXECUTION_COMPLETED: "execution_completed",
  EXECUTION_FAILED: "execution_failed",
  STATE_TRANSITION: "state_transition",
  CHECKPOINT_CREATED: "checkpoint_created",
  RETRY_STARTED: "retry_started",
  ROLLBACK_TRIGGERED: "rollback_triggered"
});

class EventBus {
  constructor({ storage } = {}) {
    this.storage = storage;
    this.listeners = new Map();
  }

  on(eventType, handler) {
    const handlers = this.listeners.get(eventType) || [];
    handlers.push(handler);
    this.listeners.set(eventType, handlers);
  }

  async emit(eventType, payload) {
    const event = {
      eventId: `${eventType}_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      type: eventType,
      timestamp: new Date().toISOString(),
      ...payload
    };

    if (this.storage && event.executionId) {
      await this.storage.appendEvent(event.executionId, event);
    }

    const handlers = this.listeners.get(eventType) || [];
    for (const handler of handlers) {
      await handler(event);
    }

    return event;
  }
}

module.exports = {
  EVENT_TYPES,
  EventBus
};
