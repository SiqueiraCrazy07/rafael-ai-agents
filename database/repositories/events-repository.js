const { BaseRepository } = require('./base-repository');

function normalizeEvent(item) {
  const event = item.data || {};

  return {
    eventId: event.eventId || item.fileName,
    type: event.type || 'unknown',
    source: event.source || null,
    workflowId: event.workflowId || null,
    project: event.project || null,
    timestamp: event.timestamp || item.updatedAt,
    payload: event.payload || event,
    safetyMode: event.safetyMode || null,
    correlationId: event.correlationId || null,
    sourcePath: item.sourcePath,
    fileName: item.fileName
  };
}

class EventsRepository extends BaseRepository {
  constructor(adapter) {
    super({
      adapter,
      collection: 'events',
      sourceDirs: ['memory/events', 'runtime-data/events'],
      normalizer: normalizeEvent
    });
  }
}

module.exports = {
  EventsRepository,
  normalizeEvent
};
