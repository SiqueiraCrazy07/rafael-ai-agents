class RuntimeStreamBackpressure {
  constructor({ maxEventsPerSubscriber = 6, maxPayloadBytes = 64 * 1024 } = {}) {
    this.maxEventsPerSubscriber = maxEventsPerSubscriber;
    this.maxPayloadBytes = maxPayloadBytes;
  }

  evaluate({ events = [], subscribers = [] } = {}) {
    const payloadBytes = Buffer.byteLength(JSON.stringify(events), "utf8");
    const subscriberCount = subscribers.length;
    const projectedDeliveries = events.length * Math.max(subscriberCount, 1);
    const overload = projectedDeliveries > this.maxEventsPerSubscriber || payloadBytes > this.maxPayloadBytes;
    return {
      status: overload ? "throttled" : "normal",
      overload,
      subscriberCount,
      eventCount: events.length,
      projectedDeliveries,
      payloadBytes,
      maxEventsPerSubscriber: this.maxEventsPerSubscriber,
      maxPayloadBytes: this.maxPayloadBytes,
      throttling: overload
        ? {
            enabled: true,
            mode: "snapshot-fallback",
            reason: projectedDeliveries > this.maxEventsPerSubscriber ? "subscriber-overload" : "payload-too-large",
            publishLiveEvents: false
          }
        : {
            enabled: false,
            mode: "live-stream",
            reason: "within-stream-limits",
            publishLiveEvents: true
          },
      safetyMode: "readonly-safe-stream-backpressure"
    };
  }
}

module.exports = {
  RuntimeStreamBackpressure
};
