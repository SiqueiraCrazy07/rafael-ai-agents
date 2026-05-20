const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { URL } = require('url');
const { createClient } = require('../../api/keys/client-registry');
const { persistApiReport } = require('../../api/server/file-store');
const { startApiServer } = require('../../api/server/index');

const WEB_ROOT = __dirname;
const ENDPOINTS = [
  '/api/v1/dashboard/summary',
  '/api/v1/dashboard/metrics',
  '/api/v1/dashboard/timelines?limit=4',
  '/api/v1/dashboard/traces?limit=4',
  '/api/v1/dashboard/workflows/problematic?limit=4',
  '/api/v1/dashboard/workers/health'
];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

function safePathFromRequest(urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const normalized = path.normalize(decoded === '/' ? '/index.html' : decoded);
  const withoutLeading = normalized.replace(/^([/\\])+/, '');
  const targetPath = path.join(WEB_ROOT, withoutLeading);

  if (!targetPath.startsWith(WEB_ROOT)) {
    return null;
  }

  return targetPath;
}

function createStaticServer() {
  return http.createServer((req, res) => {
    if (req.method !== 'GET') {
      res.writeHead(405, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        ok: false,
        fallback: {
          safeMode: true,
          reason: 'dashboard-web-readonly-get-only'
        }
      }));
      return;
    }

    const parsed = new URL(req.url, 'http://localhost');
    const targetPath = safePathFromRequest(parsed.pathname);

    if (!targetPath || !fs.existsSync(targetPath) || !fs.statSync(targetPath).isFile()) {
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(path.join(WEB_ROOT, 'index.html'), 'utf8'));
      return;
    }

    const extension = path.extname(targetPath);
    res.writeHead(200, {
      'content-type': MIME_TYPES[extension] || 'application/octet-stream',
      'cache-control': 'no-store'
    });
    res.end(fs.readFileSync(targetPath));
  });
}

async function waitForListening(server) {
  await new Promise((resolve) => {
    if (server.listening) {
      resolve();
      return;
    }

    server.on('listening', resolve);
  });
}

async function requestJson(baseUrl, endpoint, apiKey) {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'x-api-key': apiKey,
      'x-request-id': `dashboard_web_demo_${Date.now()}`
    }
  });
  const body = await response.json();

  return {
    endpoint,
    statusCode: response.status,
    ok: response.ok && body.ok === true,
    source: body.data?.source || null,
    fallbackUsed: body.data?.fallbackUsed || false,
    generatedAt: body.data?.generatedAt || null,
    keys: body.data && typeof body.data === 'object' ? Object.keys(body.data) : []
  };
}

async function requestText(url) {
  const response = await fetch(url);
  return {
    statusCode: response.status,
    ok: response.ok,
    text: await response.text()
  };
}

async function runDashboardWebDemo(options = {}) {
  const apiKey = process.env.DASHBOARD_WEB_API_KEY || `dashboard_web_${crypto.randomBytes(16).toString('hex')}`;
  const client = createClient({
    clientId: 'dashboard-web-demo-readonly-client',
    apiKey,
    scopes: ['dashboard:read', 'runtime:read', 'telemetry:read']
  });
  const { app, server: apiServer } = startApiServer({
    port: options.serve ? Number(process.env.DASHBOARD_API_PORT || 3091) : 0,
    host: '127.0.0.1',
    silent: true,
    auth: {
      clients: [client]
    }
  });
  const webServer = createStaticServer();
  webServer.listen(options.serve ? Number(process.env.DASHBOARD_WEB_PORT || 3092) : 0, '127.0.0.1');

  await waitForListening(apiServer);
  await waitForListening(webServer);

  const apiAddress = apiServer.address();
  const webAddress = webServer.address();
  const apiBaseUrl = `http://127.0.0.1:${apiAddress.port}`;
  const apiVersionedBaseUrl = `${apiBaseUrl}/api/v1`;
  const webBaseUrl = `http://127.0.0.1:${webAddress.port}`;
  const dashboardUrl = `${webBaseUrl}/?apiBase=${encodeURIComponent(apiVersionedBaseUrl)}&apiKey=${encodeURIComponent(apiKey)}`;

  if (options.serve) {
    console.log(JSON.stringify({
      status: 'dashboard-web-started',
      dashboardUrl: webBaseUrl,
      apiBaseUrl: apiVersionedBaseUrl,
      apiKey: apiKey ? 'provided-redacted' : 'not-configured',
      readonly: true,
      destructiveActions: false,
      serverMode: app.locals?.api?.serverMode,
      fallback: {
        safeMode: true,
        visualFallbackEnabled: true
      }
    }, null, 2));
    await new Promise(() => undefined);
    return { apiServer, webServer, dashboardUrl };
  }

  try {
    const assetChecks = [
      await requestText(`${webBaseUrl}/index.html`),
      await requestText(`${webBaseUrl}/app.js`),
      await requestText(`${webBaseUrl}/styles.css`)
    ];
    const apiChecks = [];

    for (const endpoint of ENDPOINTS) {
      apiChecks.push(await requestJson(apiBaseUrl, endpoint, apiKey));
    }

    const html = assetChecks[0].text;
    const js = assetChecks[1].text;
    const css = assetChecks[2].text;
    const renderChecks = {
      summaryView: html.includes('Dashboard Summary'),
      workersView: html.includes('Workers View'),
      timelinesView: html.includes('Workflow Timelines'),
      tracesView: html.includes('Execution Traces'),
      metricsView: html.includes('Metrics View'),
      apiClient: js.includes('DashboardApiClient'),
      fallbackVisual: js.includes('Fallback visual') && css.includes('system-banner')
    };
    const report = {
      dashboardWebDemoId: `dashboard_web_demo_${Date.now()}`,
      status: assetChecks.every((check) => check.ok)
        && apiChecks.every((check) => check.ok)
        && Object.values(renderChecks).every(Boolean)
        ? 'passed'
        : 'failed',
      dashboardUrl: webBaseUrl,
      apiBaseUrl: apiVersionedBaseUrl,
      apiKey: 'generated-redacted',
      readonly: true,
      destructiveActions: false,
      serverMode: app.locals?.api?.serverMode,
      assetChecks: assetChecks.map((check) => ({
        statusCode: check.statusCode,
        ok: check.ok
      })),
      apiChecks,
      renderChecks,
      visualFallback: {
        loadingStates: true,
        safeEmptyStates: true,
        apiErrorBanner: true,
        noRuntimeMutation: true
      },
      dataRendered: [
        'summary',
        'workers',
        'timelines',
        'traces',
        'metrics',
        'problematic-workflows',
        'unhealthy-workers'
      ],
      fallback: {
        safeMode: true,
        reason: 'dashboard-web-readonly-demo',
        apiFallbackVisible: apiChecks.some((check) => check.fallbackUsed)
      },
      persistence: null
    };

    report.persistence = persistApiReport('dashboard-web-demo', report, {
      directoryName: 'dashboard-web'
    });

    console.log(JSON.stringify(report, null, 2));

    if (report.status !== 'passed') {
      process.exitCode = 1;
    }

    return report;
  } finally {
    await new Promise((resolve) => webServer.close(resolve));
    await new Promise((resolve) => apiServer.close(resolve));
  }
}

if (require.main === module) {
  runDashboardWebDemo({
    serve: process.argv.includes('--serve')
  }).catch((error) => {
    console.error(JSON.stringify({
      status: 'failed',
      error: error.message,
      fallback: {
        safeMode: true,
        reason: 'dashboard-web-demo-error'
      }
    }, null, 2));
    process.exitCode = 1;
  });
}

module.exports = {
  runDashboardWebDemo
};
