import { renderMetrics } from './components/metrics.js';
import { renderSummary } from './components/summary.js';
import { renderTimelines } from './components/timelines.js';
import { renderTraces } from './components/traces.js';
import { renderWorkers } from './components/workers.js';
import { setBanner, setupNavigation } from './components/layout.js';
import { DashboardApiClient } from './services/api-client.js';
import { getState, loadConfigFromUrl, persistConfig, setState, subscribe } from './state/store.js';

const config = loadConfigFromUrl();
const client = new DashboardApiClient(config);

function syncForm() {
  document.querySelector('#api-base').value = getState().config.apiBase;
  document.querySelector('#api-key').value = getState().config.apiKey;
}

function render(state) {
  if (state.loading) {
    setBanner('loading', 'Loading dashboard data from readonly API.');
    return;
  }

  if (state.error) {
    setBanner('error', `Fallback visual: ${state.error}`);
    return;
  }

  const data = state.data;
  const fallbackUsed = [
    data.summary,
    data.metrics,
    data.timelines,
    data.traces,
    data.problematic,
    data.workers
  ].some((item) => item?.fallbackUsed);
  setBanner(fallbackUsed ? 'warn' : 'ok', fallbackUsed
    ? 'Dashboard loaded with safe fallback data.'
    : 'Dashboard loaded from readonly governed API.');

  renderSummary(data);
  renderWorkers(data);
  renderTimelines(data);
  renderTraces(data);
  renderMetrics(data);
}

async function refreshDashboard() {
  setState({ loading: true, error: null });
  try {
    const data = await client.loadDashboard();
    setState({ loading: false, data, error: null });
  } catch (error) {
    setState({
      loading: false,
      error: error.message,
      data: null
    });
  }
}

function setupConfigForm() {
  const form = document.querySelector('#api-config');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const nextConfig = {
      apiBase: document.querySelector('#api-base').value || '/api/v1',
      apiKey: document.querySelector('#api-key').value || ''
    };
    persistConfig(nextConfig);
    client.configure(nextConfig);
    refreshDashboard();
  });
}

setupNavigation();
syncForm();
setupConfigForm();
subscribe(render);
refreshDashboard();
