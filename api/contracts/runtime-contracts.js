const { RUNTIME_API_CONTRACTS } = require('./runtime-api-contracts');

const API_CONTRACT = {
  version: 'v1',
  basePath: '/api/v1',
  readonly: true,
  destructiveActions: false,
  endpoints: [
    'GET /health',
    'GET /api/v1/health',
    'GET /runtime/status',
    'GET /runtime/queue',
    'GET /runtime/events',
    'GET /runtime/decisions',
    'GET /runtime/validation',
    'GET /api/v1/runtime/status',
    'GET /api/v1/runtime/queue',
    'GET /api/v1/runtime/events',
    'GET /api/v1/runtime/decisions',
    'GET /api/v1/runtime/validation',
    'GET /api/v1/dashboard/summary',
    'GET /api/v1/dashboard/metrics',
    'GET /api/v1/dashboard/timelines',
    'GET /api/v1/dashboard/traces',
    'GET /api/v1/dashboard/workflows/problematic',
    'GET /api/v1/dashboard/workers/health'
  ],
  persistence: {
    runtime: 'runtime-data/api/',
    memory: 'memory/api/'
  },
  schemaValidation: {
    version: RUNTIME_API_CONTRACTS.version,
    querySchemas: Object.keys(RUNTIME_API_CONTRACTS.querySchemas),
    responseSchemas: Object.keys(RUNTIME_API_CONTRACTS.responseSchemas)
  }
};

module.exports = {
  API_CONTRACT,
  RUNTIME_API_CONTRACTS
};
