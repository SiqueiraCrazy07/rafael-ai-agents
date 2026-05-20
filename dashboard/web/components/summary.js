import { badge, emptyState, escapeHtml, qs } from './render-utils.js';

function metric(label, value, hint = '') {
  return `
    <article class="metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value ?? 0)}</strong>
      <span>${escapeHtml(hint)}</span>
    </article>
  `;
}

export function renderSummary(data) {
  const summary = data.summary?.summary || {};
  const metrics = data.metrics?.metrics || {};
  const problemWorkflows = data.problematic?.problematicWorkflows || [];
  const workerHealth = data.workers?.workers || {};
  const unhealthyCount = workerHealth.unhealthy?.count || summary.unhealthyWorkerCount || 0;
  const throughput = metrics.eventThroughput?.total || 0;

  qs('#generated-at').textContent = `generatedAt ${data.summary?.generatedAt || 'unknown'}`;
  qs('#runtime-source').textContent = `source: ${data.summary?.source || 'unavailable'}`;
  qs('#summary-grid').innerHTML = [
    metric('Runtime health', summary.status || data.summary?.summary?.status || 'observed', 'telemetry status'),
    metric('Worker count', (workerHealth.utilization || []).length, 'registered in telemetry'),
    metric('Unhealthy workers', unhealthyCount, 'requires attention'),
    metric('Queue depth', metrics.queueDepth || 0, 'current queue items'),
    metric('Rebalance count', metrics.rebalanceCount || 0, 'workflow moves'),
    metric('Throughput', throughput, 'events observed'),
    metric('Retry count', metrics.retryCount || 0, 'retry queue'),
    metric('Problem workflows', problemWorkflows.length, 'detected by telemetry')
  ].join('');

  qs('#problem-workflows').innerHTML = problemWorkflows.length
    ? `<div class="list">${problemWorkflows.map((workflow) => `
        <div class="row">
          <div>
            <strong>${escapeHtml(workflow.workflowId)}</strong>
            <small>${escapeHtml((workflow.problemSignals || []).join(', ') || 'problem signal')}</small>
          </div>
          ${badge(workflow.lastStage || 'unknown', 'warn')}
        </div>
      `).join('')}</div>`
    : emptyState('No problematic workflows in the latest telemetry report.');

  const flags = data.summary?.runtimeFlags || {};
  qs('#runtime-flags').innerHTML = Object.keys(flags).length
    ? `<div class="list">${Object.entries(flags).map(([key, value]) => `
        <div class="row">
          <strong>${escapeHtml(key)}</strong>
          ${badge(String(value), value === true ? 'ok' : 'warn')}
        </div>
      `).join('')}</div>`
    : emptyState('Runtime flags are not available.');
}
