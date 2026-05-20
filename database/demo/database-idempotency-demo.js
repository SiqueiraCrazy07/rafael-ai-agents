const fs = require('fs');
const path = require('path');
const { mirrorAll } = require('../repositories/mirror-service');
const { createDatabaseContext } = require('../seed/seed-filesystem-db');

const ROOT_DIR = path.resolve(__dirname, '..', '..');

function toIsoFileStamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function countTableLines(adapter, collections) {
  return collections.reduce((totals, collection) => {
    const tablePath = adapter.tablePath(collection);
    const count = fs.existsSync(tablePath)
      ? fs.readFileSync(tablePath, 'utf8').split(/\r?\n/).filter(Boolean).length
      : 0;

    return {
      ...totals,
      [collection]: count
    };
  }, {});
}

function sumCounts(counts) {
  return Object.values(counts).reduce((total, count) => total + count, 0);
}

function persistIdempotencyReport(reportName, payload) {
  const runtimeDir = path.join(ROOT_DIR, 'runtime-data', 'database-idempotency');
  const memoryDir = path.join(ROOT_DIR, 'memory', 'database-idempotency');
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

function runDatabaseIdempotencyDemo() {
  const { adapter, migration, repositories } = createDatabaseContext();
  const collections = migration.collections;
  const before = countTableLines(adapter, collections);
  const firstMirror = mirrorAll(repositories, { limit: 25 });
  const afterFirst = countTableLines(adapter, collections);
  const secondMirror = mirrorAll(repositories, { limit: 25 });
  const afterSecond = countTableLines(adapter, collections);
  const firstTotal = sumCounts(afterFirst);
  const secondTotal = sumCounts(afterSecond);

  const report = {
    databaseIdempotencyDemoId: `db_idempotency_demo_${Date.now()}`,
    status: firstMirror.status.startsWith('mirrored')
      && secondMirror.status.startsWith('mirrored')
      && firstTotal === secondTotal
      ? 'passed'
      : 'failed',
    adapter: adapter.health(),
    migration,
    logicalKeys: {
      events: 'eventId',
      decisions: 'decisionId || decisionReportId || reportId',
      transitions: 'transitionId || transitionReportId || workflow + toState',
      runtime_validation: 'validationId || reportId',
      api_governance_audit: 'requestId + timestamp',
      workflow_state: 'machineId + workflowId + updatedAt/timestamp',
      queue: 'simulationId || queueReportId || reportId + workflow/queueItemId when available'
    },
    tableCounts: {
      before,
      afterFirst,
      afterSecond,
      firstTotal,
      secondTotal,
      duplicatedBySecondMirror: secondTotal - firstTotal
    },
    firstMirror: {
      status: firstMirror.status,
      idempotency: firstMirror.idempotency
    },
    secondMirror: {
      status: secondMirror.status,
      idempotency: secondMirror.idempotency
    },
    proof: {
      secondExecutionDidNotDuplicate: firstTotal === secondTotal,
      insertedRecords: secondMirror.idempotency.insertedRecords,
      updatedRecords: secondMirror.idempotency.updatedRecords,
      skippedDuplicates: secondMirror.idempotency.skippedDuplicates
    },
    fallback: {
      safeMode: true,
      appendOnlyPreservedWhenNoLogicalKey: true,
      existingLegacyDuplicatesRemoved: false,
      jsonFilesRemoved: false
    },
    persistence: null
  };

  report.persistence = persistIdempotencyReport('database-idempotency-demo', report);
  console.log(JSON.stringify(report, null, 2));

  if (report.status !== 'passed') {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  runDatabaseIdempotencyDemo();
}

module.exports = {
  persistIdempotencyReport,
  runDatabaseIdempotencyDemo
};
