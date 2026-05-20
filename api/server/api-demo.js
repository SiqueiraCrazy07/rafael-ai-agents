const { persistApiReport } = require('./file-store');
const { startApiServer } = require('./index');
const { createClient } = require('../keys/client-registry');
const crypto = require('crypto');

const ENDPOINTS = [
  '/health',
  '/api/v1/health',
  '/api/v1/runtime/status',
  '/api/v1/runtime/queue',
  '/api/v1/runtime/events?limit=5',
  '/api/v1/runtime/decisions?limit=5',
  '/api/v1/runtime/validation',
  '/api/v1/dashboard/summary',
  '/api/v1/dashboard/metrics',
  '/api/v1/dashboard/timelines?limit=2',
  '/api/v1/dashboard/traces?limit=2',
  '/api/v1/dashboard/workflows/problematic?limit=2',
  '/api/v1/dashboard/workers/health',
  '/runtime/status',
  '/runtime/queue',
  '/runtime/events?limit=2',
  '/runtime/decisions?limit=2',
  '/runtime/validation'
];

async function requestJson(baseUrl, endpoint, apiKey) {
  const startedAt = Date.now();
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'x-api-key': apiKey,
      'x-request-id': `api_demo_${Date.now()}`
    }
  });
  const body = await response.json();

  return {
    endpoint,
    statusCode: response.status,
    ok: response.ok && body.ok === true,
    requestId: body.requestId,
    durationMs: Date.now() - startedAt,
    fallback: body.fallback || null,
    keys: body.data && typeof body.data === 'object' ? Object.keys(body.data) : []
  };
}

async function runApiDemo() {
  const apiKey = `demo_${crypto.randomBytes(16).toString('hex')}`;
  const client = createClient({
    clientId: 'api-demo-readonly-client',
    apiKey,
    scopes: ['runtime:read', 'events:read', 'decisions:read', 'validation:read']
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
    const results = [];

    for (const endpoint of ENDPOINTS) {
      results.push(await requestJson(baseUrl, endpoint, apiKey));
    }

    const report = {
      apiDemoId: `api_demo_${Date.now()}`,
      status: results.every((result) => result.ok) ? 'passed' : 'failed',
      baseUrl,
      serverMode: app.locals && app.locals.api && app.locals.api.serverMode,
      auth: {
        clientId: client.clientId,
        readonly: client.readonly,
        enabled: client.enabled
      },
      readonly: true,
      destructiveActions: false,
      endpoints: results,
      fallback: {
        safeMode: true,
        expressFallbackUsed: app.locals && app.locals.api && app.locals.api.serverMode === 'express-compat',
        reason: app.locals && app.locals.api && app.locals.api.fallbackReason
      },
      persistence: null
    };

    report.persistence = persistApiReport('api-demo', report);

    console.log(JSON.stringify(report, null, 2));

    if (report.status !== 'passed') {
      process.exitCode = 1;
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

if (require.main === module) {
  runApiDemo().catch((error) => {
    console.error(JSON.stringify({
      status: 'failed',
      error: error.message,
      fallback: {
        safeMode: true,
        reason: 'api-demo-error'
      }
    }, null, 2));
    process.exitCode = 1;
  });
}

module.exports = {
  runApiDemo
};
