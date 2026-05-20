const { createQueryLayer } = require('../repositories/query-layer');
const { createDatabaseContext } = require('../seed/seed-filesystem-db');

function runDatabaseDemo() {
  const { adapter, migration, repositories } = createDatabaseContext();
  const queryLayer = createQueryLayer(repositories);
  const events = queryLayer.listEvents({ limit: 5 });
  const decisions = queryLayer.listDecisions({ limit: 5 });
  const transitions = queryLayer.listTransitions({ limit: 5 });
  const auditTrail = queryLayer.listAuditTrail({ limit: 5 });
  const validation = queryLayer.listRuntimeValidation({ limit: 3 });
  const workflowStates = queryLayer.listWorkflowStates({ limit: 3 });
  const queueStatus = queryLayer.getQueueStatus();
  const queueRecord = queueStatus.record || queueStatus.records[0] || {};

  const report = {
    databaseDemoId: `db_demo_${Date.now()}`,
    status: migration.status === 'applied' ? 'passed' : 'fallback',
    adapter: adapter.health(),
    migration,
    queryLayer: {
      events: {
        source: events.source,
        available: events.available,
        total: events.total,
        returned: events.records.length,
        readErrors: events.readErrors
      },
      decisions: {
        source: decisions.source,
        available: decisions.available,
        total: decisions.total,
        returned: decisions.records.length,
        readErrors: decisions.readErrors
      },
      transitions: {
        source: transitions.source,
        available: transitions.available,
        total: transitions.total,
        returned: transitions.records.length,
        readErrors: transitions.readErrors
      },
      apiGovernanceAudit: {
        source: auditTrail.source,
        available: auditTrail.available,
        total: auditTrail.total,
        returned: auditTrail.records.length,
        readErrors: auditTrail.readErrors
      },
      runtimeValidation: {
        source: validation.source,
        available: validation.available,
        total: validation.total,
        returned: validation.records.length,
        readErrors: validation.readErrors
      },
      workflowState: {
        source: workflowStates.source,
        available: workflowStates.available,
        total: workflowStates.total,
        returned: workflowStates.records.length,
        sampleWorkflowId: workflowStates.records[0] ? workflowStates.records[0].workflowId : null,
        readErrors: workflowStates.readErrors
      },
      queue: {
        source: queueStatus.source,
        available: queueStatus.available,
        total: queueStatus.total,
        totalQueueItems: queueRecord.totalQueueItems || 0,
        totalRetryItems: queueRecord.totalRetryItems || 0,
        protectedQueueCount: queueRecord.protectedQueueCount || 0,
        readErrors: queueStatus.readErrors
      }
    },
    fallback: {
      safeMode: true,
      databasePrimary: false,
      jsonPrimaryPreserved: true
    },
    persistence: null
  };

  report.persistence = adapter.persistReport('database-demo', report);
  console.log(JSON.stringify(report, null, 2));

  if (report.status !== 'passed') {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  runDatabaseDemo();
}

module.exports = {
  runDatabaseDemo
};
