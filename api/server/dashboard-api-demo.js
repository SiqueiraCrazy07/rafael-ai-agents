const crypto = require('crypto');
const { persistApiReport } = require('./file-store');
const { startApiServer } = require('./index');
const { createClient } = require('../keys/client-registry');

const ENDPOINTS = [
  '/api/v1/dashboard/summary',
  '/api/v1/dashboard/metrics',
  '/api/v1/dashboard/timelines?limit=3',
  '/api/v1/dashboard/traces?limit=3',
  '/api/v1/dashboard/workflows/problematic?limit=3',
  '/api/v1/dashboard/workers/health'
];

async function requestJson(baseUrl, endpoint, apiKey) {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'x-api-key': apiKey,
      'x-request-id': `dashboard_api_demo_${Date.now()}`
    }
  });
  const body = await response.json();

  return {
    endpoint,
    statusCode: response.status,
    ok: response.ok && body.ok === true,
    requestId: body.requestId,
    source: body.data?.source || null,
    fallbackUsed: body.data?.fallbackUsed || false,
    generatedAt: body.data?.generatedAt || null,
    readErrors: body.data?.readErrors || [],
    keys: body.data && typeof body.data === 'object' ? Object.keys(body.data) : []
  };
}

async function runDashboardApiDemo() {
  const apiKey = `dashboard_demo_${crypto.randomBytes(16).toString('hex')}`;
  const client = createClient({
    clientId: 'dashboard-api-demo-readonly-client',
    apiKey,
    scopes: ['runtime:read', 'dashboard:read', 'telemetry:read']
  });
  const { app, server } = startApiServer({
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
    const endpoints = [];

    for (const endpoint of ENDPOINTS) {
      endpoints.push(await requestJson(baseUrl, endpoint, apiKey));
    }

    const report = {
      dashboardApiDemoId: `dashboard_api_demo_${Date.now()}`,
      status: endpoints.every((endpoint) => endpoint.ok) ? 'passed' : 'failed',
      baseUrl,
      serverMode: app.locals?.api?.serverMode,
      readonly: true,
      destructiveActions: false,
      endpoints,
      dataExposed: [
        'summary',
        'metrics',
        'timelines',
        'traces',
        'problematic-workflows',
        'worker-health'
      ],
      fallback: {
        safeMode: true,
        expressFallbackUsed: app.locals?.api?.serverMode === 'express-compat',
        reason: app.locals?.api?.fallbackReason || null
      },
      persistence: null
    };

    report.persistence = persistApiReport('dashboard-api-demo', report, {
      directoryName: 'dashboard-api'
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
  runDashboardApiDemo().catch((error) => {
    console.error(JSON.stringify({
      status: 'failed',
      error: error.message,
      fallback: {
        safeMode: true,
        reason: 'dashboard-api-demo-error'
      }
    }, null, 2));
    process.exitCode = 1;
  });
}

module.exports = {
  runDashboardApiDemo
};
