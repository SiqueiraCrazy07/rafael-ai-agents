const { EVENT_TYPES, RUNTIME_QUERY_SCHEMAS } = require('../schemas/runtime-query-schemas');
const { RUNTIME_RESPONSE_SCHEMAS } = require('../schemas/runtime-response-schemas');
const { DASHBOARD_API_CONTRACTS } = require('./dashboard-api-contracts');
const { DASHBOARD_RESPONSE_SCHEMAS } = require('../schemas/dashboard-response-schemas');

const RUNTIME_API_CONTRACTS = {
  version: 'v1',
  basePath: '/api/v1',
  readonly: true,
  destructiveActions: false,
  endpoints: {
    health: {
      method: 'GET',
      paths: ['/health', '/api/v1/health'],
      querySchema: 'empty',
      responseSchema: 'health'
    },
    runtimeStatus: {
      method: 'GET',
      paths: ['/runtime/status', '/api/v1/runtime/status'],
      querySchema: 'empty',
      responseSchema: 'runtimeStatus'
    },
    queueStatus: {
      method: 'GET',
      paths: ['/runtime/queue', '/api/v1/runtime/queue'],
      querySchema: 'empty',
      responseSchema: 'queueStatus'
    },
    events: {
      method: 'GET',
      paths: ['/runtime/events', '/api/v1/runtime/events'],
      querySchema: 'events',
      responseSchema: 'events',
      filters: ['limit', 'offset', 'eventType', 'workflowId', 'correlationId']
    },
    decisions: {
      method: 'GET',
      paths: ['/runtime/decisions', '/api/v1/runtime/decisions'],
      querySchema: 'decisions',
      responseSchema: 'decisions',
      filters: ['limit', 'offset', 'workflowId', 'correlationId']
    },
    validation: {
      method: 'GET',
      paths: ['/runtime/validation', '/api/v1/runtime/validation'],
      querySchema: 'empty',
      responseSchema: 'validation'
    },
    ...DASHBOARD_API_CONTRACTS.endpoints
  },
  querySchemas: RUNTIME_QUERY_SCHEMAS,
  responseSchemas: {
    ...RUNTIME_RESPONSE_SCHEMAS,
    ...DASHBOARD_RESPONSE_SCHEMAS
  },
  eventTypes: EVENT_TYPES,
  persistence: {
    runtime: 'runtime-data/api-validation/',
    memory: 'memory/api-validation/'
  }
};

module.exports = {
  RUNTIME_API_CONTRACTS
};
