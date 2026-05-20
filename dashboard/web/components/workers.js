import { badge, emptyState, escapeHtml, percent, qs } from './render-utils.js';

export function renderWorkers(data) {
  const workers = data.workers?.workers || {};
  const utilization = workers.utilization || [];
  const unhealthyIds = new Set(workers.unhealthy?.workerIds || []);
  const saturatedIds = new Set((workers.saturated || []).map((worker) => worker.workerId));

  qs('#workers-view').innerHTML = utilization.length
    ? `<div class="worker-grid">${utilization.map((worker) => {
        const unhealthy = unhealthyIds.has(worker.workerId) || worker.healthStatus === 'unhealthy';
        const saturated = saturatedIds.has(worker.workerId) || Number(worker.utilization || 0) >= 1;
        return `
          <article class="worker">
            <div class="row">
              <div>
                <strong>${escapeHtml(worker.workerId)}</strong>
                <small>assigned ${escapeHtml(worker.assigned)} / limit ${escapeHtml(worker.concurrencyLimit)}</small>
              </div>
              ${badge(unhealthy ? 'unhealthy' : worker.healthStatus || 'unknown', unhealthy ? 'bad' : 'ok')}
            </div>
            <div class="bar" aria-label="worker utilization">
              <span style="--value:${percent(worker.utilization)}"></span>
            </div>
            <p class="meta">utilization ${percent(worker.utilization)} ${saturated ? ' - saturated' : ''}</p>
            <p class="meta">throttling: tracked in runtime metrics</p>
            <p class="meta">active leases: available in orchestration traces</p>
          </article>
        `;
      }).join('')}</div>`
    : emptyState('No worker utilization data is available.');
}
