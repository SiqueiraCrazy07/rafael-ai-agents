class EventBackpressureManager {
  constructor({ maxInMemoryEvents = 1000, throttleThreshold = 0.8 } = {}) {
    this.maxInMemoryEvents = maxInMemoryEvents;
    this.throttleThreshold = throttleThreshold;
    this.throttled = false;
    this.overflowCount = 0;
  }

  evaluate(currentDepth) {
    const utilization = this.maxInMemoryEvents === 0 ? 1 : currentDepth / this.maxInMemoryEvents;
    if (currentDepth >= this.maxInMemoryEvents) {
      this.overflowCount += 1;
      this.throttled = true;
      return {
        accepted: false,
        mode: "overflow-protection",
        utilization,
        reason: "event-buffer-overflow-protection"
      };
    }
    if (utilization >= this.throttleThreshold) {
      this.throttled = true;
      return {
        accepted: true,
        mode: "throttled",
        utilization,
        reason: "event-buffer-throttling"
      };
    }
    this.throttled = false;
    return {
      accepted: true,
      mode: "normal",
      utilization,
      reason: "event-buffer-healthy"
    };
  }

  status(currentDepth) {
    return {
      maxInMemoryEvents: this.maxInMemoryEvents,
      currentDepth,
      throttled: this.throttled,
      overflowCount: this.overflowCount
    };
  }
}

module.exports = {
  EventBackpressureManager
};
