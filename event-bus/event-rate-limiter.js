class EventRateLimiter {
  constructor({ maxEventsPerWindow = 100, windowMs = 1000 } = {}) {
    this.maxEventsPerWindow = maxEventsPerWindow;
    this.windowMs = windowMs;
    this.events = [];
  }

  allow(now = Date.now()) {
    this.events = this.events.filter((timestamp) => now - timestamp < this.windowMs);
    if (this.events.length >= this.maxEventsPerWindow) {
      return {
        allowed: false,
        reason: "rate-limit-exceeded",
        retryAfterMs: this.windowMs - (now - this.events[0])
      };
    }
    this.events.push(now);
    return {
      allowed: true,
      remaining: this.maxEventsPerWindow - this.events.length
    };
  }
}

module.exports = {
  EventRateLimiter
};
