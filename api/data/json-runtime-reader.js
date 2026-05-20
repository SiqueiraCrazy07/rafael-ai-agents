const {
  readJsonHistory,
  readLatestJson
} = require('../server/file-store');

function normalizePagination(query = {}, defaultLimit = 20) {
  return {
    limit: query.limit || defaultLimit,
    offset: query.offset || 0
  };
}

function matchesEventFilters(item, filters) {
  const event = item.data || {};

  if (filters.eventType && event.type !== filters.eventType) {
    return false;
  }

  if (filters.workflowId && event.workflowId !== filters.workflowId) {
    return false;
  }

  if (filters.correlationId && event.correlationId !== filters.correlationId) {
    return false;
  }

  return true;
}

function matchesDecisionFilters(item, filters) {
  const serialized = JSON.stringify(item.data || {});

  if (filters.workflowId && !serialized.includes(filters.workflowId)) {
    return false;
  }

  if (filters.correlationId && !serialized.includes(filters.correlationId)) {
    return false;
  }

  return true;
}

function latestSummary(label, relativeDir) {
  const latest = readLatestJson(relativeDir);

  return {
    label,
    relativeDir,
    available: latest.available,
    sourcePath: latest.sourcePath,
    fileName: latest.fileName,
    updatedAt: latest.updatedAt,
    readErrors: latest.readErrors,
    fallback: latest.fallback || null
  };
}

class JsonRuntimeReader {
  readEvents(query = {}) {
    const { limit, offset } = normalizePagination(query);
    const history = readJsonHistory('memory/events', Math.min(limit + offset + 100, 200));
    const filtered = history.items.filter((item) => matchesEventFilters(item, query));
    const paginated = filtered.slice(offset, offset + limit);

    return {
      source: 'json-fallback',
      fallbackUsed: true,
      available: history.available,
      sourceDir: history.sourceDir,
      totalFiles: history.totalFiles || 0,
      returned: paginated.length,
      events: paginated.map((item) => ({
        fileName: item.fileName,
        sourcePath: item.sourcePath,
        updatedAt: item.updatedAt,
        event: item.data
      })),
      readErrors: history.readErrors,
      fallback: history.fallback
    };
  }

  readDecisions(query = {}) {
    const { limit, offset } = normalizePagination(query);
    const history = readJsonHistory('memory/decisions', Math.min(limit + offset + 100, 200));
    const filtered = history.items.filter((item) => matchesDecisionFilters(item, query));
    const paginated = filtered.slice(offset, offset + limit);

    return {
      source: 'json-fallback',
      fallbackUsed: true,
      available: history.available,
      sourceDir: history.sourceDir,
      totalFiles: history.totalFiles || 0,
      returned: paginated.length,
      reports: paginated.map((item) => ({
        fileName: item.fileName,
        sourcePath: item.sourcePath,
        updatedAt: item.updatedAt,
        report: item.data
      })),
      readErrors: history.readErrors,
      fallback: history.fallback
    };
  }

  readValidation() {
    const latest = readLatestJson('memory/runtime-validation');

    return {
      source: 'json-fallback',
      fallbackUsed: true,
      available: latest.available,
      sourcePath: latest.sourcePath,
      fileName: latest.fileName,
      updatedAt: latest.updatedAt,
      validation: latest.data,
      readErrors: latest.readErrors,
      fallback: latest.fallback || null
    };
  }

  readQueue() {
    const latest = readLatestJson('memory/queue');
    const integration = readLatestJson('memory/enforcement-integration');
    const report = latest.data || {};
    const queueItems = report.queueItems || report.queue || report.workflowQueue || report.items || [];
    const retryItems = report.retryItems || report.retryQueue || [];
    const protectedQueue = report.protectedQueue || [];
    const metrics = report.metrics || report.summary || null;
    const throttling = report.throttling
      || (metrics && metrics.throttling)
      || (report.optimizationEnforcement
        ? {
            maxConcurrentExecutions: report.optimizationEnforcement.maxConcurrentExecutions || null,
            mode: report.optimizationEnforcement.throttlingMode || null,
            reason: report.optimizationEnforcement.reason || 'optimization-enforcement'
          }
        : null);

    return {
      source: 'json-fallback',
      fallbackUsed: true,
      available: latest.available,
      sourcePath: latest.sourcePath,
      fileName: latest.fileName,
      updatedAt: latest.updatedAt,
      metrics,
      queue: queueItems,
      queueItems,
      retryQueue: retryItems,
      retryItems,
      protectedQueue,
      enforcementIntegration: {
        available: integration.available,
        sourcePath: integration.sourcePath,
        fileName: integration.fileName,
        updatedAt: integration.updatedAt,
        summary: integration.data && (integration.data.summary || integration.data.enforcement || integration.data.fallback)
      },
      throttling,
      workers: report.workers || [],
      totalQueueItems: queueItems.length,
      totalRetryItems: retryItems.length,
      protectedQueueCount: protectedQueue.length,
      readErrors: [...latest.readErrors, ...integration.readErrors],
      fallback: latest.fallback || null
    };
  }

  readRuntimeStatus() {
    const validation = this.readValidation();
    const queue = latestSummary('queue', 'memory/queue');
    const decisions = latestSummary('decisions', 'memory/decisions');
    const events = readJsonHistory('memory/events', 1);
    const transitions = latestSummary('state-transitions', 'memory/state-transitions');

    const readiness = validation.available && validation.validation
      ? validation.validation.readiness || validation.validation.status || 'unknown'
      : 'unknown';

    return {
      source: 'json-fallback',
      fallbackUsed: true,
      phase: 'phase-2',
      apiReadiness: 'database-read-integration-ready',
      runtimeReadiness: readiness,
      sources: {
        validation,
        queue,
        decisions,
        events: {
          available: events.available,
          sourceDir: events.sourceDir,
          totalFiles: events.totalFiles || 0,
          latest: events.items[0]
            ? {
                fileName: events.items[0].fileName,
                sourcePath: events.items[0].sourcePath,
                updatedAt: events.items[0].updatedAt
              }
            : null,
          readErrors: events.readErrors,
          fallback: events.fallback
        },
        transitions
      },
      readErrors: [
        ...(validation.readErrors || []),
        ...(queue.readErrors || []),
        ...(decisions.readErrors || []),
        ...(events.readErrors || []),
        ...(transitions.readErrors || [])
      ],
      safety: {
        readonly: true,
        declarativeQueryOnly: true
      }
    };
  }
}

module.exports = {
  JsonRuntimeReader
};
