const { QUEUE_SCHEMA } = require('./queue-schema');

const DATABASE_SCHEMAS = {
  events: {
    collection: 'events',
    idField: 'eventId',
    required: ['eventId', 'type', 'source', 'timestamp', 'payload']
  },
  decisions: {
    collection: 'decisions',
    idField: 'decisionReportId',
    required: ['decisionReportId', 'decisions', 'sourcePath']
  },
  transitions: {
    collection: 'transitions',
    idField: 'transitionReportId',
    required: ['transitionReportId', 'appliedTransitions', 'sourcePath']
  },
  runtimeValidation: {
    collection: 'runtime_validation',
    idField: 'validationId',
    required: ['validationId', 'status', 'readiness', 'sourcePath']
  },
  apiGovernanceAudit: {
    collection: 'api_governance_audit',
    idField: 'auditId',
    required: ['auditId', 'requestId', 'route', 'timestamp', 'status']
  },
  workflowState: {
    collection: 'workflow_state',
    idField: 'machineId',
    required: ['machineId', 'workflowId', 'state', 'sourcePath']
  },
  queue: QUEUE_SCHEMA
};

module.exports = {
  DATABASE_SCHEMAS
};
