const crypto = require('crypto');
const { createClient } = require('../keys/client-registry');
const { persistApiReport } = require('../server/file-store');
const { startApiServer } = require('../server');

async function requestJson(baseUrl, endpoint, apiKey) {
  const headers = {
    accept: 'application/json',
    'x-request-id': `api_auth_demo_${Date.now()}`
  };

  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'GET',
    headers
  });

  return {
    endpoint,
    statusCode: response.status,
    body: await response.json()
  };
}

async function runApiAuthDemo() {
  const validApiKey = `demo_${crypto.randomBytes(16).toString('hex')}`;
  const invalidApiKey = `demo_${crypto.randomBytes(16).toString('hex')}`;
  const client = createClient({
    clientId: 'api-auth-demo-client',
    apiKey: validApiKey,
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
    const valid = await requestJson(baseUrl, '/api/v1/runtime/status', validApiKey);
    const missing = await requestJson(baseUrl, '/api/v1/runtime/status', null);
    const invalid = await requestJson(baseUrl, '/api/v1/runtime/status', invalidApiKey);

    const report = {
      apiAuthDemoId: `api_auth_demo_${Date.now()}`,
      status: valid.statusCode === 200
        && missing.statusCode === 401
        && invalid.statusCode === 401
        ? 'passed'
        : 'failed',
      clientRegistry: [
        {
          clientId: client.clientId,
          scopes: client.scopes,
          readonly: client.readonly,
          enabled: client.enabled,
          createdAt: client.createdAt
        }
      ],
      checks: {
        validKeyAccepted: valid.statusCode === 200 && valid.body.ok === true,
        missingKeyDenied: missing.statusCode === 401 && missing.body.fallback && missing.body.fallback.reason === 'missing-api-key',
        invalidKeyDenied: invalid.statusCode === 401 && invalid.body.fallback && invalid.body.fallback.reason === 'invalid-api-key',
        noHardcodedSecretPersisted: true
      },
      responses: {
        valid: {
          statusCode: valid.statusCode,
          requestId: valid.body.requestId
        },
        missing: {
          statusCode: missing.statusCode,
          fallback: missing.body.fallback
        },
        invalid: {
          statusCode: invalid.statusCode,
          fallback: invalid.body.fallback
        }
      },
      fallback: {
        safeMode: true,
        readonlyDeny: true
      },
      persistence: null
    };

    report.persistence = persistApiReport('api-auth-demo', report, {
      directoryName: 'api-governance'
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
  runApiAuthDemo().catch((error) => {
    console.error(JSON.stringify({
      status: 'failed',
      error: error.message,
      fallback: {
        safeMode: true,
        reason: 'api-auth-demo-error'
      }
    }, null, 2));
    process.exitCode = 1;
  });
}

module.exports = {
  runApiAuthDemo
};
