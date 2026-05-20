const EVENT_TYPES = [
  'workflow-created',
  'workflow-queued',
  'workflow-paused',
  'workflow-rerouted',
  'workflow-throttled',
  'workflow-recovering',
  'workflow-completed',
  'workflow-failed',
  'workflow-quarantined',
  'decision-created',
  'enforcement-applied',
  'recovery-triggered',
  'worker-lease-created',
  'worker-lease-expired',
  'workflow-rebalanced',
  'worker-overloaded',
  'worker-unhealthy'
];

const COMMON_HISTORY_QUERY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    limit: {
      type: 'integer',
      min: 1,
      max: 100,
      default: 20
    },
    offset: {
      type: 'integer',
      min: 0,
      max: 10000,
      default: 0
    },
    workflowId: {
      type: 'string',
      maxLength: 120,
      pattern: '^[a-zA-Z0-9._:-]+$'
    },
    correlationId: {
      type: 'string',
      maxLength: 160,
      pattern: '^[a-zA-Z0-9._:-]+$'
    }
  }
};

const RUNTIME_QUERY_SCHEMAS = {
  empty: {
    type: 'object',
    additionalProperties: false,
    properties: {}
  },
  events: {
    ...COMMON_HISTORY_QUERY_SCHEMA,
    properties: {
      ...COMMON_HISTORY_QUERY_SCHEMA.properties,
      eventType: {
        type: 'string',
        enum: EVENT_TYPES
      }
    }
  },
  decisions: {
    ...COMMON_HISTORY_QUERY_SCHEMA
  },
  dashboardHistory: {
    ...COMMON_HISTORY_QUERY_SCHEMA
  }
};

module.exports = {
  EVENT_TYPES,
  RUNTIME_QUERY_SCHEMAS
};
