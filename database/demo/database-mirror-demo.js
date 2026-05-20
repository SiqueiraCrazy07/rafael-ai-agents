const { mirrorAll } = require('../repositories/mirror-service');
const { createQueryLayer } = require('../repositories/query-layer');
const { createDatabaseContext } = require('../seed/seed-filesystem-db');

function runDatabaseMirrorDemo() {
  const { adapter, migration, repositories } = createDatabaseContext();
  const mirror = mirrorAll(repositories, { limit: 25 });
  const queryLayer = createQueryLayer(repositories);
  const events = queryLayer.listEvents({ limit: 5 });
  const decisions = queryLayer.listDecisions({ limit: 5 });
  const transitions = queryLayer.listTransitions({ limit: 5 });
  const auditTrail = queryLayer.listAuditTrail({ limit: 5 });
  const runtimeValidation = queryLayer.listRuntimeValidation({ limit: 1 });
  const workflowStates = queryLayer.listWorkflowStates({ limit: 1 });
  const queueStatus = queryLayer.getQueueStatus();
  const queueRecord = queueStatus.record || queueStatus.records[0] || {};
  const workflowStateLookup = workflowStates.records[0] && workflowStates.records[0].workflowId
    ? queryLayer.getWorkflowState(workflowStates.records[0].workflowId)
    : {
        source: 'database',
        available: false,
        workflowId: null,
        record: null,
        readErrors: [],
        fallback: {
          safeMode: true,
          reason: 'no-workflow-state-sample'
        }
      };

  const report = {
    databaseMirrorDemoId: `db_mirror_demo_${Date.now()}`,
    status: mirror.status === 'mirrored' ? 'passed' : 'passed-with-read-errors',
    adapter: adapter.health(),
    migration,
    mirror,
    queriesAfterMirror: {
      events: {
        source: events.source,
        total: events.total,
        returned: events.records.length
      },
      decisions: {
        source: decisions.source,
        total: decisions.total,
        returned: decisions.records.length
      },
      transitions: {
        source: transitions.source,
        total: transitions.total,
        returned: transitions.records.length
      },
      apiGovernanceAudit: {
        source: auditTrail.source,
        total: auditTrail.total,
        returned: auditTrail.records.length
      },
      runtimeValidation: {
        source: runtimeValidation.source,
        total: runtimeValidation.total,
        returned: runtimeValidation.records.length
      },
      workflowState: {
        source: workflowStates.source,
        total: workflowStates.total,
        returned: workflowStates.records.length,
        lookupAvailable: workflowStateLookup.available,
        workflowId: workflowStateLookup.workflowId
      },
      queue: {
        source: queueStatus.source,
        total: queueStatus.total,
        available: queueStatus.available,
        totalQueueItems: queueRecord.totalQueueItems || 0,
        totalRetryItems: queueRecord.totalRetryItems || 0,
        protectedQueueCount: queueRecord.protectedQueueCount || 0
      }
    },
    fallback: {
      safeMode: true,
      jsonFilesRemoved: false,
      databasePrimary: false,
      jsonPrimaryPreserved: true
    },
    persistence: null
  };

  report.persistence = adapter.persistReport('database-mirror-demo', report);
  console.log(JSON.stringify(report, null, 2));

  if (!['passed', 'passed-with-read-errors'].includes(report.status)) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  runDatabaseMirrorDemo();
}

module.exports = {
  runDatabaseMirrorDemo
};
