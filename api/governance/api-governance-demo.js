const crypto = require('crypto');
const { createClient } = require('../keys/client-registry');
const { persistApiReport } = require('../server/file-store');
const { startApiServer } = require('../server');

async function requestJson(baseUrl, endpoint, apiKey, options = {}) {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: options.method || 'GET',
    headers: {
      accept: 'application/json',
      'x-api-key': apiKey,
      'x-request-id': `api_governance_demo_${Date.now()}`,
      'x-correlation-id': options.correlationId || `api_governance_corr_${Date.now()}`
    }
  });

  return {
    endpoint,
    method: options.method || 'GET',
    statusCode: response.status,
    body: await response.json()
  };
}

async function runApiGovernanceDemo() {
  const apiKey = `demo_${crypto.randomBytes(16).toString('hex')}`;
  const client = createClient({
    clientId: 'api-governance-demo-client',
    apiKey,
    scopes: ['runtime:read', 'events:read', 'decisions:read', 'validation:read']
  });
  const { server } = startApiServer({
    port: 0,
    host: '127.0.0.1',
    silent: true,
    auth: {
      clients: [client],
      rateLimit: {
        windowMs: 60000,
        maxRequests: 2
      }
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
    const first = await requestJson(baseUrl, '/api/v1/runtime/status', apiKey);
    const second = await requestJson(baseUrl, '/api/v1/runtime/events?limit=1', apiKey);
    const limited = await requestJson(baseUrl, '/api/v1/runtime/decisions?limit=1', apiKey);
    const destructive = await requestJson(baseUrl, '/api/v1/runtime/status', apiKey, { method: 'POST' });

    const report = {
      apiGovernanceDemoId: `api_governance_demo_${Date.now()}`,
      status: first.statusCode === 200
        && second.statusCode === 200
        && limited.statusCode === 429
        && destructive.statusCode === 403
        ? 'passed'
        : 'failed',
      client: {
        clientId: client.clientId,
        scopes: client.scopes,
        readonly: client.readonly,
        enabled: client.enabled
      },
      policies: [
        'readonly-only',
        'deny-destructive-actions',
        'safe-request-policy',
        'request-tracing-policy'
      ],
      checks: {
        readonlyAllowed: first.statusCode === 200 && first.body.ok === true,
        auditHeadersAccepted: Boolean(first.body.requestId),
        rateLimitExceeded: limited.statusCode === 429 && limited.body.fallback && limited.body.fallback.reason === 'rate-limit-exceeded',
        destructiveDenied: destructive.statusCode === 403 && destructive.body.fallback && destructive.body.fallback.reason === 'api-governance-policy-denied'
      },
      responses: {
        first: {
          statusCode: first.statusCode,
          requestId: first.body.requestId
        },
        second: {
          statusCode: second.statusCode,
          requestId: second.body.requestId
        },
        limited: {
          statusCode: limited.statusCode,
          fallback: limited.body.fallback
        },
        destructive: {
          statusCode: destructive.statusCode,
          fallback: destructive.body.fallback
        }
      },
      fallback: {
        safeMode: true,
        runtimeInternalUnaffected: true,
        destructiveActions: false
      },
      persistence: null
    };

    report.persistence = persistApiReport('api-governance-demo', report, {
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
  runApiGovernanceDemo().catch((error) => {
    console.error(JSON.stringify({
      status: 'failed',
      error: error.message,
      fallback: {
        safeMode: true,
        reason: 'api-governance-demo-error'
      }
    }, null, 2));
    process.exitCode = 1;
  });
}

module.exports = {
  runApiGovernanceDemo
};
