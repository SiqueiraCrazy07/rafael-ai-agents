class QueueTelemetry {
  constructor() {
    this.events = [];
  }

  record(type, payload = {}) {
    const event = {
      eventId: `queue_event_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      type,
      payload,
      createdAt: new Date().toISOString()
    };

    this.events.push(event);
    return event;
  }

  metrics({ queueItems, retryItems, results, workers, throttling }) {
    const completed = results.filter((result) => result.status === "completed").length;
    const failed = results.filter((result) => result.status === "failed").length;
    const blocked = results.filter((result) => result.status === "blocked").length;

    return {
      generatedAt: new Date().toISOString(),
      queued: queueItems.length,
      retryQueued: retryItems.length,
      completed,
      failed,
      blocked,
      totalResults: results.length,
      workersRegistered: workers.length,
      activeWorkers: workers.filter((worker) => worker.status === "active").length,
      throttling,
      events: this.events.length
    };
  }
}

module.exports = {
  QueueTelemetry
};
