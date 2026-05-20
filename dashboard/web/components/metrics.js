import { badge, emptyState, escapeHtml, qs } from './render-utils.js';

function section(title, rows) {
  return `
    <section class="panel">
      <h3>${escapeHtml(title)}</h3>
      <div class="list">
        ${rows.map(([label, value, tone]) => `
          <div class="row">
            <strong>${escapeHtml(label)}</strong>
            ${badge(String(value ?? 0), tone || '')}
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

export function renderMetrics(data) {
  const metrics = data.metrics?.metrics || {};
  const executions = metrics.workflowExecutions || {};
  const eventThroughput = metrics.eventThroughput || {};
  const decisionThroughput = metrics.decisionThroughput || {};

  qs('#metrics-view').innerHTML = Object.keys(metrics).length
    ? `<div class="metric-sections">
        ${section('Workflow Metrics', [
          ['executions total', executions.total],
          ['completed', executions.completed, 'ok'],
          ['failed', executions.failed, executions.failed > 0 ? 'bad' : 'ok'],
          ['waiting worker', executions.waitingWorker, executions.waitingWorker > 0 ? 'warn' : 'ok']
        ])}
        ${section('Queue Metrics', [
          ['queue depth', metrics.queueDepth],
          ['retry count', metrics.retryCount],
          ['throttling count', metrics.throttlingCount, metrics.throttlingCount > 0 ? 'warn' : 'ok']
        ])}
        ${section('Orchestration Metrics', [
          ['rebalance count', metrics.rebalanceCount, metrics.rebalanceCount > 0 ? 'warn' : 'ok'],
          ['lease expirations', metrics.leaseExpirationCount, metrics.leaseExpirationCount > 0 ? 'warn' : 'ok'],
          ['unhealthy workers', metrics.unhealthyWorkers?.count, metrics.unhealthyWorkers?.count > 0 ? 'bad' : 'ok']
        ])}
        ${section('Throughput', [
          ['event throughput', eventThroughput.total],
          ['decision throughput', decisionThroughput.total],
          ['api reports', metrics.apiReports],
          ['openapi exports', metrics.openApiExports]
        ])}
      </div>`
    : emptyState('Metrics are not available from the latest telemetry report.');
}
