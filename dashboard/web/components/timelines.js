import { badge, emptyState, escapeHtml, qs } from './render-utils.js';

export function renderTimelines(data) {
  const timelines = data.timelines?.timelines || [];

  qs('#timelines-view').innerHTML = timelines.length
    ? `<div class="timeline-list">${timelines.map((timeline) => `
        <article class="timeline">
          <div class="row">
            <div>
              <strong>${escapeHtml(timeline.workflowId)}</strong>
              <small>correlationId ${(timeline.correlationIds || []).map(escapeHtml).join(', ') || 'not available'}</small>
            </div>
            ${badge((timeline.problemSignals || []).length ? 'attention' : 'normal', (timeline.problemSignals || []).length ? 'warn' : 'ok')}
          </div>
          <div class="timeline-steps">
            ${(timeline.entries || []).slice(0, 16).map((entry) => `
              <div class="step">
                <strong>${escapeHtml(entry.stage)}</strong>
                <small>${escapeHtml(entry.source || 'runtime')}</small>
              </div>
            `).join('')}
          </div>
          <p class="meta">stages: ${(timeline.stages || []).map(escapeHtml).join(' -> ') || 'none'}</p>
        </article>
      `).join('')}</div>`
    : emptyState('No workflow timelines are available.');
}
