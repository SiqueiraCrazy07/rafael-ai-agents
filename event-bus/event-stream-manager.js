class EventStreamManager {
  constructor() {
    this.streams = new Map();
    this.sequence = 0;
  }

  append(event) {
    this.sequence += 1;
    const streamId = event.topic;
    const stream = this.streams.get(streamId) || [];
    const eventWithOrdering = {
      ...event,
      ordering: {
        sequence: this.sequence,
        stream: streamId,
        streamPosition: stream.length + 1,
        orderedAt: new Date().toISOString()
      }
    };
    stream.push(eventWithOrdering);
    this.streams.set(streamId, stream);
    return eventWithOrdering;
  }

  getStream(topic) {
    return [...(this.streams.get(topic) || [])];
  }

  listStreams() {
    return [...this.streams.entries()].map(([topic, events]) => ({
      topic,
      eventCount: events.length,
      lastSequence: events.at(-1)?.ordering?.sequence || 0
    }));
  }
}

module.exports = {
  EventStreamManager
};
