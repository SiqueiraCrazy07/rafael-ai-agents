class EventPublisher {
  constructor({ eventBus }) {
    this.eventBus = eventBus;
  }

  publish(event) {
    return this.eventBus.publish(event);
  }

  publishMany(events) {
    return events.map((event) => this.publish(event));
  }
}

module.exports = {
  EventPublisher
};
