const { createQueryLayer } = require('../../database/repositories/query-layer');
const { createDatabaseContext } = require('../../database/seed/seed-filesystem-db');

function normalizePagination(query = {}, defaultLimit = 20) {
  return {
    limit: query.limit || defaultLimit,
    offset: query.offset || 0
  };
}

function mapEventRecord(record) {
  return {
    fileName: record.fileName || null,
    sourcePath: record.sourcePath || null,
    updatedAt: record.timestamp || (record._db && record._db.mirroredAt) || null,
    event: {
      eventId: record.eventId,
      type: record.type,
      source: record.source,
      workflowId: record.workflowId,
      project: record.project,
      timestamp: record.timestamp,
      payload: record.payload,
      safetyMode: record.safetyMode,
      correlationId: record.correlationId
    }
  };
}

function mapDecisionRecord(record) {
  return {
    fileName: record.fileName || null,
    sourcePath: record.sourcePath || null,
    updatedAt: record.timestamp || (record._db && record._db.mirroredAt) || null,
    report: {
      decisionReportId: record.decisionReportId,
      status: record.status,
      source: record.source,
      decisions: record.decisions,
      coordination: record.coordination,
      fallback: record.fallback,
      readErrors: record.readErrors
    }
  };
}

function mapQueueRecord(record, result) {
  return {
    source: result.source,
    fallbackUsed: result.source !== 'database',
    available: Boolean(record),
    sourcePath: record ? record.sourcePath : result.sourcePath || null,
    fileName: record ? record.fileName : null,
    updatedAt: record ? record.generatedAt || record.timestamp || (record._db && record._db.mirroredAt) : null,
    metrics: record ? record.metrics || null : null,
    queue: record ? record.queueItems || [] : [],
    queueItems: record ? record.queueItems || [] : [],
    retryQueue: record ? record.retryItems || [] : [],
    retryItems: record ? record.retryItems || [] : [],
    protectedQueue: record ? record.protectedQueue || [] : [],
    enforcementIntegration: record
      ? {
          available: Boolean(record.optimizationEnforcement),
          source: record.policySource || null,
          summary: record.optimizationEnforcement || null
        }
      : null,
    throttling: record ? record.throttling || null : null,
    workers: record ? record.workers || [] : [],
    totalQueueItems: record ? record.totalQueueItems || 0 : 0,
    totalRetryItems: record ? record.totalRetryItems || 0 : 0,
    protectedQueueCount: record ? record.protectedQueueCount || 0 : 0,
    readErrors: result.readErrors || [],
    fallback: result.fallback || null
  };
}

class DatabaseRuntimeReader {
  constructor(options = {}) {
    this.context = createDatabaseContext(options.database || {});
    this.queryLayer = createQueryLayer(this.context.repositories);
  }

  readEvents(query = {}) {
    const { limit, offset } = normalizePagination(query);
    const result = this.queryLayer.listEvents({
      limit,
      offset,
      type: query.eventType,
      workflowId: query.workflowId,
      correlationId: query.correlationId
    });

    return {
      source: result.source,
      fallbackUsed: result.source !== 'database',
      available: result.available,
      sourceDir: result.sourcePath || null,
      totalFiles: result.total || 0,
      returned: result.records.length,
      events: result.records.map(mapEventRecord),
      readErrors: result.readErrors || [],
      fallback: result.fallback || null
    };
  }

  readDecisions(query = {}) {
    const { limit, offset } = normalizePagination(query);
    const result = this.queryLayer.listDecisions({
      limit,
      offset,
      workflowId: query.workflowId,
      correlationId: query.correlationId
    });

    return {
      source: result.source,
      fallbackUsed: result.source !== 'database',
      available: result.available,
      sourceDir: result.sourcePath || null,
      totalFiles: result.total || 0,
      returned: result.records.length,
      reports: result.records.map(mapDecisionRecord),
      readErrors: result.readErrors || [],
      fallback: result.fallback || null
    };
  }

  readValidation() {
    const result = this.queryLayer.listRuntimeValidation({ limit: 1 });
    const record = result.records[0] || null;

    return {
      source: result.source,
      fallbackUsed: result.source !== 'database',
      available: Boolean(record),
      sourcePath: record ? record.sourcePath : result.sourcePath || null,
      fileName: record ? record.fileName : null,
      updatedAt: record ? record.timestamp : null,
      validation: record,
      readErrors: result.readErrors || [],
      fallback: record ? result.fallback || null : {
        safeMode: true,
        reason: 'database-runtime-validation-not-found'
      }
    };
  }

  readQueue() {
    const result = this.queryLayer.getQueueStatus();
    const record = result.record || result.records[0] || null;

    return mapQueueRecord(record, result);
  }

  readRuntimeStatus() {
    const validation = this.readValidation();
    const events = this.readEvents({ limit: 1 });
    const decisions = this.readDecisions({ limit: 1 });
    const transitions = this.queryLayer.listTransitions({ limit: 1 });
    const queue = this.readQueue();

    const readiness = validation.available && validation.validation
      ? validation.validation.readiness || validation.validation.status || 'unknown'
      : 'unknown';

    return {
      source: [validation.source, events.source, decisions.source, transitions.source].includes('database')
        ? 'database'
        : 'json-fallback',
      fallbackUsed: [validation, events, decisions, queue].some((item) => item.fallbackUsed),
      phase: 'phase-2',
      apiReadiness: 'database-read-integration-ready',
      runtimeReadiness: readiness,
      sources: {
        validation,
        queue,
        decisions: {
          available: decisions.available,
          source: decisions.source,
          fallbackUsed: decisions.fallbackUsed,
          totalFiles: decisions.totalFiles,
          returned: decisions.returned,
          readErrors: decisions.readErrors,
          fallback: decisions.fallback
        },
        events: {
          available: events.available,
          source: events.source,
          fallbackUsed: events.fallbackUsed,
          totalFiles: events.totalFiles,
          returned: events.returned,
          readErrors: events.readErrors,
          fallback: events.fallback
        },
        transitions: {
          available: transitions.available,
          source: transitions.source,
          fallbackUsed: transitions.source !== 'database',
          totalFiles: transitions.total || 0,
          returned: transitions.records.length,
          readErrors: transitions.readErrors || [],
          fallback: transitions.fallback || null
        }
      },
      readErrors: [
        ...(validation.readErrors || []),
        ...(events.readErrors || []),
        ...(decisions.readErrors || []),
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
  DatabaseRuntimeReader
};
