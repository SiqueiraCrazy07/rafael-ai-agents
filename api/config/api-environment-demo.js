const crypto = require('crypto');
const { createClient } = require('../keys/client-registry');
const { persistApiReport } = require('../server/file-store');
const { startApiServer } = require('../server');

async function waitForServer(server) {
  await new Promise((resolve) => {
    if (server.listening) {
      resolve();
      return;
    }

    server.on('listening', resolve);
  });
}

async function requestJson(baseUrl, endpoint, apiKey = null, options = {}) {
  const headers = {
    accept: 'application/json',
    'x-request-id': `api_env_demo_${Date.now()}`
  };

  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: options.method || 'GET',
    headers
  });

  return {
    endpoint,
    method: options.method || 'GET',
    statusCode: response.status,
    body: await response.json()
  };
}

async function runScenario(name, flags, endpoint = '/api/v1/runtime/status') {
  const apiKey = `demo_${crypto.randomBytes(16).toString('hex')}`;
  const client = createClient({
    clientId: `api-env-demo-${name}`,
    apiKey,
    scopes: ['runtime:read', 'events:read', 'decisions:read', 'validation:read']
  });
  const { app, server } = startApiServer({
    port: 0,
    host: '127.0.0.1',
    silent: true,
    environment: {
      flags
    },
    auth: {
      clients: [client]
    }
  });

  try {
    await waitForServer(server);
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const response = await requestJson(baseUrl, endpoint, apiKey);
    const data = response.body.data || {};

    return {
      name,
      endpoint,
      statusCode: response.statusCode,
      ok: response.body.ok === true,
      source: data.source || null,
      fallbackUsed: Boolean(data.fallbackUsed),
      runtimeFlags: data.runtimeFlags || (response.body.api && response.body.api.runtimeFlags),
      databaseReadEnabled: data.databaseReadEnabled,
      jsonFallbackEnabled: data.jsonFallbackEnabled,
      safeModeEnabled: data.safeModeEnabled,
      fallback: response.body.fallback || data.fallback || null,
      appFlags: app.locals.api.environment.responseFields
    };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function runAuthRequiredScenario() {
  const apiKey = `demo_${crypto.randomBytes(16).toString('hex')}`;
  const client = createClient({
    clientId: 'api-env-demo-auth-required',
    apiKey,
    scopes: ['runtime:read']
  });
  const { server } = startApiServer({
    port: 0,
    host: '127.0.0.1',
    silent: true,
    environment: {
      flags: {
        API_REQUIRE_AUTH: true
      }
    },
    auth: {
      clients: [client]
    }
  });

  try {
    await waitForServer(server);
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const denied = await requestJson(baseUrl, '/api/v1/runtime/status');
    const allowed = await requestJson(baseUrl, '/api/v1/runtime/status', apiKey);

    return {
      name: 'auth-required-mode',
      missingKeyStatusCode: denied.statusCode,
      validKeyStatusCode: allowed.statusCode,
      missingKeyDenied: denied.statusCode === 401,
      validKeyAllowed: allowed.statusCode === 200
    };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function runSafeModeScenario() {
  const apiKey = `demo_${crypto.randomBytes(16).toString('hex')}`;
  const client = createClient({
    clientId: 'api-env-demo-safe-mode',
    apiKey,
    scopes: ['runtime:read']
  });
  const { server } = startApiServer({
    port: 0,
    host: '127.0.0.1',
    silent: true,
    environment: {
      flags: {
        API_SAFE_MODE: true,
        API_READONLY_MODE: false
      }
    },
    auth: {
      clients: [client]
    }
  });

  try {
    await waitForServer(server);
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const destructive = await requestJson(baseUrl, '/api/v1/runtime/status', apiKey, { method: 'POST' });

    return {
      name: 'safe-mode-enabled',
      statusCode: destructive.statusCode,
      destructiveDenied: destructive.statusCode === 403,
      fallback: destructive.body.fallback || null
    };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function runApiEnvironmentDemo() {
  const scenarios = [];

  scenarios.push(await runScenario('database-read-enabled', {
    API_USE_DATABASE_READ: true,
    API_ALLOW_JSON_FALLBACK: true
  }));
  scenarios.push(await runScenario('database-read-disabled', {
    API_USE_DATABASE_READ: false,
    API_ALLOW_JSON_FALLBACK: true
  }));
  scenarios.push(await runScenario('json-fallback-enabled', {
    API_USE_DATABASE_READ: false,
    API_ALLOW_JSON_FALLBACK: true
  }, '/api/v1/runtime/queue'));
  scenarios.push(await runScenario('json-fallback-disabled', {
    API_USE_DATABASE_READ: false,
    API_ALLOW_JSON_FALLBACK: false
  }));
  scenarios.push(await runSafeModeScenario());
  scenarios.push(await runAuthRequiredScenario());

  const checks = {
    databaseReadEnabled: scenarios.find((item) => item.name === 'database-read-enabled').source === 'database',
    databaseReadDisabled: scenarios.find((item) => item.name === 'database-read-disabled').source === 'json-fallback',
    jsonFallbackEnabled: scenarios.find((item) => item.name === 'json-fallback-enabled').source === 'json-fallback',
    jsonFallbackDisabled: scenarios.find((item) => item.name === 'json-fallback-disabled').source === 'unavailable',
    safeModeEnabled: scenarios.find((item) => item.name === 'safe-mode-enabled').destructiveDenied === true,
    authRequiredMode: scenarios.find((item) => item.name === 'auth-required-mode').missingKeyDenied === true
  };

  const report = {
    apiEnvironmentDemoId: `api_env_demo_${Date.now()}`,
    status: Object.values(checks).every(Boolean) ? 'passed' : 'failed',
    defaults: {
      readonlyMode: true,
      requireAuth: true,
      allowJsonFallback: true,
      useDatabaseRead: true,
      safeMode: true
    },
    checks,
    scenarios,
    fallback: {
      safeMode: true,
      databaseMandatory: false,
      jsonFallbackControlledByFlag: true,
      destructiveActions: false
    },
    persistence: null
  };

  report.persistence = persistApiReport('api-environment-demo', report, {
    directoryName: 'api-environment'
  });

  console.log(JSON.stringify(report, null, 2));

  if (report.status !== 'passed') {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  runApiEnvironmentDemo().catch((error) => {
    console.error(JSON.stringify({
      status: 'failed',
      error: error.message,
      fallback: {
        safeMode: true,
        reason: 'api-environment-demo-error'
      }
    }, null, 2));
    process.exitCode = 1;
  });
}

module.exports = {
  runApiEnvironmentDemo
};
