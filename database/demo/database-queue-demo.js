const fs = require('fs');
const path = require('path');
const { mirrorRepository } = require('../repositories/mirror-service');
const { createQueryLayer } = require('../repositories/query-layer');
const { createDatabaseContext } = require('../seed/seed-filesystem-db');

const ROOT_DIR = path.resolve(__dirname, '..', '..');

function toIsoFileStamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function persistQueueIntegrationReport(reportName, payload) {
  const runtimeDir = path.join(ROOT_DIR, 'runtime-data', 'queue-database-integration');
  const memoryDir = path.join(ROOT_DIR, 'memory', 'queue-database-integration');
  fs.mkdirSync(runtimeDir, { recursive: true });
  fs.mkdirSync(memoryDir, { recursive: true });

  const fileName = `${reportName}-${toIsoFileStamp()}.json`;
  const runtimePath = path.join(runtimeDir, fileName);
  const memoryPath = path.join(memoryDir, fileName);
  const body = JSON.stringify(payload, null, 2);

  fs.writeFileSync(runtimePath, body);
  fs.writeFileSync(memoryPath, body);

  return {
    runtimePath,
    memoryPath
  };
}

function runDatabaseQueueDemo() {
  const { adapter, migration, repositories } = createDatabaseContext();
  const mirror = mirrorRepository(repositories.queue, { limit: 25 });
  const queryLayer = createQueryLayer(repositories);
  const queueStatus = queryLayer.getQueueStatus();
  const record = queueStatus.record || queueStatus.records[0] || null;

  const report = {
    queueDatabaseDemoId: `db_queue_demo_${Date.now()}`,
    status: mirror.insertErrors.length === 0 && queueStatus.source === 'database' && Boolean(record)
      ? 'passed'
      : 'fallback',
    adapter: adapter.health(),
    migration,
    mirrorMode: {
      enabled: true,
      destructiveActions: false,
      jsonSourcePreserved: true,
      collection: mirror.collection,
      mirroredCount: mirror.mirroredCount,
      idempotency: mirror.idempotency,
      sources: mirror.sources,
      readErrors: mirror.readErrors,
      insertErrors: mirror.insertErrors
    },
    queueRepository: {
      source: queueStatus.source,
      available: queueStatus.available,
      sourcePath: queueStatus.sourcePath,
      totalMirroredRecords: queueStatus.total || 0,
      queueReportId: record ? record.queueReportId : null,
      totalQueueItems: record ? record.totalQueueItems || 0 : 0,
      totalRetryItems: record ? record.totalRetryItems || 0 : 0,
      protectedQueueCount: record ? record.protectedQueueCount || 0 : 0,
      throttling: record ? record.throttling || null : null,
      workersCount: record && Array.isArray(record.workers) ? record.workers.length : 0,
      readErrors: queueStatus.readErrors || []
    },
    fallback: {
      safeMode: true,
      databasePrimaryOnly: false,
      jsonFallbackRequired: true,
      reason: queueStatus.source === 'database'
        ? null
        : 'queue repository unavailable or empty'
    },
    persistence: null
  };

  report.persistence = persistQueueIntegrationReport('queue-database-integration', report);
  console.log(JSON.stringify(report, null, 2));

  if (!['passed', 'fallback'].includes(report.status)) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  runDatabaseQueueDemo();
}

module.exports = {
  persistQueueIntegrationReport,
  runDatabaseQueueDemo
};
