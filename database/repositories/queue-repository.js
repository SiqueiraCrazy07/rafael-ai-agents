const { BaseRepository } = require('./base-repository');

function normalizeQueueReport(item) {
  const report = item.data || {};
  const queueItems = report.queueItems || report.queue || report.items || [];
  const retryItems = report.retryItems || report.retryQueue || [];
  const protectedQueue = report.protectedQueue || [];
  const metrics = report.metrics || {};
  const throttling = metrics.throttling || report.throttling || (report.optimizationEnforcement && {
    maxConcurrentExecutions: report.optimizationEnforcement.maxConcurrentExecutions,
    mode: report.optimizationEnforcement.throttlingMode,
    reason: report.optimizationEnforcement.enforcementId
      ? `optimization-enforcement:${report.optimizationEnforcement.enforcementId}`
      : null
  }) || null;

  return {
    queueReportId: report.simulationId || report.queueReportId || report.reportId || item.fileName,
    simulationId: report.simulationId || null,
    generatedAt: report.generatedAt || metrics.generatedAt || item.updatedAt,
    policySource: report.policySource || null,
    optimizationEnforcement: report.optimizationEnforcement || null,
    queueItems,
    retryItems,
    protectedQueue,
    metrics,
    throttling,
    workers: report.workers || [],
    heartbeats: report.heartbeats || [],
    leases: report.leases || [],
    locks: report.locks || [],
    results: report.results || [],
    telemetryEvents: report.telemetryEvents || [],
    totalQueueItems: queueItems.length,
    totalRetryItems: retryItems.length,
    protectedQueueCount: protectedQueue.length,
    sourcePath: item.sourcePath,
    fileName: item.fileName,
    timestamp: report.generatedAt || metrics.generatedAt || item.updatedAt
  };
}

class QueueRepository extends BaseRepository {
  constructor(adapter) {
    super({
      adapter,
      collection: 'queue',
      sourceDirs: ['memory/queue', 'runtime-data/queue'],
      normalizer: normalizeQueueReport
    });
  }

  latest() {
    const listed = this.list({ limit: 10000 });
    const records = [...listed.records].sort((left, right) => {
      const leftTime = Date.parse(left.timestamp || left.generatedAt || (left._db && left._db.mirroredAt) || 0);
      const rightTime = Date.parse(right.timestamp || right.generatedAt || (right._db && right._db.mirroredAt) || 0);
      return rightTime - leftTime;
    });
    const record = records[0] || null;

    return {
      available: Boolean(record),
      collection: this.collection,
      record,
      total: records.length,
      readErrors: listed.readErrors,
      sourcePath: listed.sourcePath,
      fallback: record ? null : {
        safeMode: true,
        reason: listed.available ? 'queue-record-not-found' : 'database-unavailable'
      }
    };
  }
}

module.exports = {
  QueueRepository,
  normalizeQueueReport
};
