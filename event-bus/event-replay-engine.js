class EventReplayEngine {
  constructor({ persistence, streamManager = null } = {}) {
    this.persistence = persistence;
    this.streamManager = streamManager;
  }

  replay({ workflowId = null, correlationId = null, from = null, to = null, topic = null } = {}) {
    const loaded = this.persistence.loadEvents();
    const fromTime = from ? new Date(from).getTime() : null;
    const toTime = to ? new Date(to).getTime() : null;

    const events = loaded.events.filter((event) => {
      const eventTime = new Date(event.timestamp).getTime();
      if (workflowId && event.workflowId !== workflowId) {
        return false;
      }
      if (correlationId && event.correlationId !== correlationId) {
        return false;
      }
      if (topic && event.topic !== topic) {
        return false;
      }
      if (fromTime && eventTime < fromTime) {
        return false;
      }
      if (toTime && eventTime > toTime) {
        return false;
      }
      return true;
    });

    return {
      replayId: `replay_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      readonly: true,
      safetyMode: "readonly-safe-replay",
      filters: { workflowId, correlationId, from, to, topic },
      total: events.length,
      events,
      readErrors: loaded.readErrors,
      missingSources: loaded.missingSources,
      fallback: loaded.fallback
    };
  }
}

module.exports = {
  EventReplayEngine
};
