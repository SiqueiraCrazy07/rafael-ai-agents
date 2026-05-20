import { badge, emptyState, escapeHtml, qs } from './render-utils.js';

function signalTone(trace) {
  return (trace.problemSignals || []).length > 0 ? 'warn' : 'ok';
}

export function renderTraces(data) {
  const traces = data.traces?.traces || [];

  qs('#traces-view').innerHTML = traces.length
    ? `<div class="trace-list">${traces.map((trace) => `
        <article class="panel">
          <div class="row">
            <div>
              <strong>${escapeHtml(trace.workflowId)}</strong>
              <small>${escapeHtml((trace.correlationIds || []).join(', ') || 'no correlationId')}</small>
            </div>
            ${badge((trace.problemSignals || []).join(', ') || 'normal', signalTone(trace))}
          </div>
          <div class="trace-events">
            ${badge(`executions ${trace.executions || 0}`)}
            ${badge(`assignments ${trace.workerAssignments || 0}`)}
            ${badge(`transitions ${trace.transitions || 0}`)}
            ${badge(`decisions ${trace.decisions || 0}`)}
            ${badge(`events ${trace.events || 0}`)}
            ${badge(`rebalances ${trace.rebalances || 0}`)}
            ${badge(`leases ${trace.leases || 0}`)}
            ${badge(`retries/throttling via events`)}
          </div>
        </article>
      `).join('')}</div>`
    : emptyState('No execution traces are available.');
}
