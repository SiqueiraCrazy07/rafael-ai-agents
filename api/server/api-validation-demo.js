const { persistApiReport } = require('./file-store');
const { startApiServer } = require('./index');
const { createClient } = require('../keys/client-registry');
const { RUNTIME_API_CONTRACTS } = require('../contracts/runtime-api-contracts');
const { validateQuery } = require('../validators/request-validator');
const { validateResponse } = require('../validators/response-validator');
const crypto = require('crypto');

const VALID_ENDPOINTS = [
  { endpoint: '/api/v1/health', schema: 'health' },
  { endpoint: '/api/v1/runtime/status', schema: 'runtimeStatus' },
  { endpoint: '/api/v1/runtime/queue', schema: 'queueStatus' },
  { endpoint: '/api/v1/runtime/events?limit=3&offset=0&eventType=workflow-queued', schema: 'events' },
  { endpoint: '/api/v1/runtime/decisions?limit=3&offset=0', schema: 'decisions' },
  { endpoint: '/api/v1/runtime/validation', schema: 'validation' },
  { endpoint: '/api/v1/dashboard/summary', schema: 'dashboardSummary' },
  { endpoint: '/api/v1/dashboard/metrics', schema: 'dashboardMetrics' },
  { endpoint: '/api/v1/dashboard/timelines?limit=3&offset=0', schema: 'dashboardTimelines' },
  { endpoint: '/api/v1/dashboard/traces?limit=3&offset=0', schema: 'dashboardTraces' },
  { endpoint: '/api/v1/dashboard/workflows/problematic?limit=3&offset=0', schema: 'dashboardProblematicWorkflows' },
  { endpoint: '/api/v1/dashboard/workers/health', schema: 'dashboardWorkerHealth' }
];

const INVALID_ENDPOINTS = [
  {
    endpoint: '/api/v1/runtime/events?limit=999',
    expectedStatus: 400,
    reason: 'limit above max'
  },
  {
    endpoint: '/api/v1/runtime/events?eventType=invalid-event',
    expectedStatus: 400,
    reason: 'invalid event type'
  },
  {
    endpoint: '/api/v1/runtime/decisions?workflowId=bad value',
    expectedStatus: 400,
    reason: 'invalid workflowId characters'
  },
  {
    endpoint: '/api/v1/runtime/events?unknown=true',
    expectedStatus: 400,
    reason: 'unknown query param'
  },
  {
    endpoint: '/api/v1/dashboard/timelines?limit=999',
    expectedStatus: 400,
    reason: 'dashboard limit above max'
  },
  {
    endpoint: '/api/v1/dashboard/traces?workflowId=bad value',
    expectedStatus: 400,
    reason: 'dashboard invalid workflowId characters'
  }
];

async function fetchJson(baseUrl, endpoint, apiKey) {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'x-api-key': apiKey,
      'x-request-id': `api_validation_demo_${Date.now()}`
    }
  });

  return {
    statusCode: response.status,
    body: await response.json()
  };
}

async function runApiValidationDemo() {
  const apiKey = `demo_${crypto.randomBytes(16).toString('hex')}`;
  const client = createClient({
    clientId: 'api-validation-demo-client',
    apiKey,
    scopes: ['runtime:read', 'events:read', 'decisions:read', 'validation:read']
  });
  const { server } = startApiServer({
    port: 0,
    host: '127.0.0.1',
    silent: true,
    auth: {
      clients: [client]
    }
  });

  try {
    await new Promise((resolve) => {
      if (server.listening) {
        resolve();
        return;
      }

      server.on('listening', resolve);
    });

    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const validResponses = [];
    const invalidResponses = [];

    for (const item of VALID_ENDPOINTS) {
      const response = await fetchJson(baseUrl, item.endpoint, apiKey);
      const validation = validateResponse(item.schema, response.body);

      validResponses.push({
        endpoint: item.endpoint,
        statusCode: response.statusCode,
        responseSchema: item.schema,
        valid: response.statusCode === 200 && validation.valid,
        errors: validation.errors,
        requestId: response.body.requestId
      });
    }

    for (const item of INVALID_ENDPOINTS) {
      const response = await fetchJson(baseUrl, item.endpoint, apiKey);

      invalidResponses.push({
        endpoint: item.endpoint,
        expectedStatus: item.expectedStatus,
        actualStatus: response.statusCode,
        fallbackReason: response.body && response.body.fallback && response.body.fallback.reason,
        validFallback: response.statusCode === item.expectedStatus && response.body.ok === false,
        reason: item.reason,
        requestId: response.body.requestId
      });
    }

    const directQueryValidation = {
      validEventsQuery: validateQuery('events', {
        limit: '5',
        offset: '0',
        eventType: 'workflow-created',
        workflowId: 'workflow-1',
        correlationId: 'corr-1'
      }),
      invalidEventsQuery: validateQuery('events', {
        limit: '0',
        eventType: 'not-real'
      }),
      validDashboardQuery: validateQuery('dashboardHistory', {
        limit: '5',
        offset: '0',
        workflowId: 'workflow-1',
        correlationId: 'corr-1'
      }),
      invalidDashboardQuery: validateQuery('dashboardHistory', {
        limit: '101',
        workflowId: 'bad value'
      })
    };

    const report = {
      apiValidationDemoId: `api_validation_demo_${Date.now()}`,
      status: validResponses.every((item) => item.valid) && invalidResponses.every((item) => item.validFallback)
        ? 'passed'
        : 'failed',
      baseUrl,
      contracts: {
        version: RUNTIME_API_CONTRACTS.version,
        readonly: RUNTIME_API_CONTRACTS.readonly,
        destructiveActions: RUNTIME_API_CONTRACTS.destructiveActions,
        endpoints: Object.keys(RUNTIME_API_CONTRACTS.endpoints),
        querySchemas: Object.keys(RUNTIME_API_CONTRACTS.querySchemas),
        responseSchemas: Object.keys(RUNTIME_API_CONTRACTS.responseSchemas)
      },
      validResponses,
      invalidResponses,
      directQueryValidation,
      fallback: {
        safeMode: true,
        invalidPayloadFallback: true,
        readonly: true,
        destructiveActions: false
      },
      persistence: null
    };

    report.persistence = persistApiReport('api-validation-demo', report, {
      directoryName: 'api-validation'
    });

    console.log(JSON.stringify(report, null, 2));

    if (report.status !== 'passed') {
      process.exitCode = 1;
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

if (require.main === module) {
  runApiValidationDemo().catch((error) => {
    console.error(JSON.stringify({
      status: 'failed',
      error: error.message,
      fallback: {
        safeMode: true,
        reason: 'api-validation-demo-error'
      }
    }, null, 2));
    process.exitCode = 1;
  });
}

module.exports = {
  runApiValidationDemo
};
