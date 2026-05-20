const crypto = require('crypto');
const { createClient } = require('../keys/client-registry');
const { persistApiReport } = require('../server/file-store');
const { startApiServer } = require('../server');

const ENDPOINTS = [
  '/api/v1/runtime/status',
  '/api/v1/runtime/queue',
  '/api/v1/runtime/events?limit=3',
  '/api/v1/runtime/decisions?limit=3',
  '/api/v1/runtime/validation'
];

async function requestJson(baseUrl, endpoint, apiKey) {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'x-api-key': apiKey,
      'x-request-id': `api_db_read_demo_${Date.now()}`
    }
  });

  return {
    endpoint,
    statusCode: response.status,
    body: await response.json()
  };
}

async function runApiDatabaseReadDemo() {
  const apiKey = `demo_${crypto.randomBytes(16).toString('hex')}`;
  const client = createClient({
    clientId: 'api-db-read-demo-client',
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
    const responses = [];

    for (const endpoint of ENDPOINTS) {
      const response = await requestJson(baseUrl, endpoint, apiKey);
      const data = response.body.data || {};

      responses.push({
        endpoint,
        statusCode: response.statusCode,
        ok: response.body.ok === true,
        source: data.source || null,
        fallbackUsed: Boolean(data.fallbackUsed),
        readErrors: data.readErrors || [],
        requestId: response.body.requestId
      });
    }

    const databaseBackedEndpoints = responses.filter((item) => [
      '/api/v1/runtime/status',
      '/api/v1/runtime/queue',
      '/api/v1/runtime/events?limit=3',
      '/api/v1/runtime/decisions?limit=3',
      '/api/v1/runtime/validation'
    ].includes(item.endpoint));
    const queue = responses.find((item) => item.endpoint === '/api/v1/runtime/queue');

    const report = {
      apiDatabaseReadDemoId: `api_db_read_demo_${Date.now()}`,
      status: responses.every((item) => item.statusCode === 200 && item.ok)
        && databaseBackedEndpoints.every((item) => item.source === 'database')
        ? 'passed'
        : 'failed',
      readonly: true,
      destructiveActions: false,
      endpoints: responses,
      sources: {
        database: databaseBackedEndpoints.map((item) => item.endpoint),
        jsonFallback: responses.filter((item) => item.source === 'json-fallback').map((item) => item.endpoint)
      },
      fallback: {
        safeMode: true,
        jsonPrimaryPreserved: true,
        databasePrimaryOnly: false,
        queueFallbackReason: queue && queue.source === 'json-fallback'
          ? 'queue repository unavailable or empty'
          : null
      },
      persistence: null
    };

    report.persistence = persistApiReport('api-database-read-demo', report, {
      directoryName: 'api-database-integration'
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
  runApiDatabaseReadDemo().catch((error) => {
    console.error(JSON.stringify({
      status: 'failed',
      error: error.message,
      fallback: {
        safeMode: true,
        reason: 'api-database-read-demo-error'
      }
    }, null, 2));
    process.exitCode = 1;
  });
}

module.exports = {
  runApiDatabaseReadDemo
};
