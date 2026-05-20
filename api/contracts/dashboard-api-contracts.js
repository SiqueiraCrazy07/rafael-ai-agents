const { DASHBOARD_RESPONSE_SCHEMAS } = require('../schemas/dashboard-response-schemas');

const DASHBOARD_API_CONTRACTS = {
  version: 'v1',
  basePath: '/api/v1',
  readonly: true,
  destructiveActions: false,
  endpoints: {
    dashboardSummary: {
      method: 'GET',
      paths: ['/api/v1/dashboard/summary'],
      querySchema: 'empty',
      responseSchema: 'dashboardSummary'
    },
    dashboardMetrics: {
      method: 'GET',
      paths: ['/api/v1/dashboard/metrics'],
      querySchema: 'empty',
      responseSchema: 'dashboardMetrics'
    },
    dashboardTimelines: {
      method: 'GET',
      paths: ['/api/v1/dashboard/timelines'],
      querySchema: 'dashboardHistory',
      responseSchema: 'dashboardTimelines',
      filters: ['limit', 'offset', 'workflowId', 'correlationId']
    },
    dashboardTraces: {
      method: 'GET',
      paths: ['/api/v1/dashboard/traces'],
      querySchema: 'dashboardHistory',
      responseSchema: 'dashboardTraces',
      filters: ['limit', 'offset', 'workflowId', 'correlationId']
    },
    dashboardProblematicWorkflows: {
      method: 'GET',
      paths: ['/api/v1/dashboard/workflows/problematic'],
      querySchema: 'dashboardHistory',
      responseSchema: 'dashboardProblematicWorkflows',
      filters: ['limit', 'offset', 'workflowId', 'correlationId']
    },
    dashboardWorkerHealth: {
      method: 'GET',
      paths: ['/api/v1/dashboard/workers/health'],
      querySchema: 'empty',
      responseSchema: 'dashboardWorkerHealth'
    }
  },
  responseSchemas: DASHBOARD_RESPONSE_SCHEMAS,
  persistence: {
    runtime: 'runtime-data/dashboard-api/',
    memory: 'memory/dashboard-api/'
  }
};

module.exports = {
  DASHBOARD_API_CONTRACTS
};
