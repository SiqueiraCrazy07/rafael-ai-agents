const ENDPOINTS = {
  summary: '/dashboard/summary',
  metrics: '/dashboard/metrics',
  timelines: '/dashboard/timelines?limit=12',
  traces: '/dashboard/traces?limit=12',
  problematic: '/dashboard/workflows/problematic?limit=12',
  workers: '/dashboard/workers/health'
};

function trimSlash(value) {
  return String(value || '').replace(/\/$/, '');
}

export class DashboardApiClient {
  constructor({ apiBase = '/api/v1', apiKey = '' } = {}) {
    this.apiBase = trimSlash(apiBase);
    this.apiKey = apiKey;
  }

  configure({ apiBase, apiKey }) {
    if (apiBase) {
      this.apiBase = trimSlash(apiBase);
    }
    this.apiKey = apiKey || '';
  }

  async request(endpoint) {
    const headers = {
      accept: 'application/json',
      'x-request-id': `dashboard_web_${Date.now()}`
    };

    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }

    const response = await fetch(`${this.apiBase}${endpoint}`, {
      method: 'GET',
      headers
    });
    const body = await response.json();

    if (!response.ok || body.ok !== true) {
      const reason = body.fallback?.reason || body.data?.fallback?.reason || 'dashboard-api-request-failed';
      throw new Error(`${reason} (${response.status})`);
    }

    return body.data;
  }

  async loadDashboard() {
    const [summary, metrics, timelines, traces, problematic, workers] = await Promise.all([
      this.request(ENDPOINTS.summary),
      this.request(ENDPOINTS.metrics),
      this.request(ENDPOINTS.timelines),
      this.request(ENDPOINTS.traces),
      this.request(ENDPOINTS.problematic),
      this.request(ENDPOINTS.workers)
    ]);

    return {
      summary,
      metrics,
      timelines,
      traces,
      problematic,
      workers
    };
  }
}

export { ENDPOINTS };
