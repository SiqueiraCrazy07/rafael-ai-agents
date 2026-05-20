const { readJsonHistory } = require("./runtime-metrics-collector");

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function workflowOfEvent(event) {
  return event.workflowId || event.payload?.workflow || null;
}

function normalizeWorkflowId(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    return value.workflowId || value.workflow || value.id || null;
  }

  return String(value);
}

class RuntimeTraceManager {
  constructor(rootDir = process.cwd(), options = {}) {
    this.rootDir = rootDir;
    this.limit = options.limit || 100;
  }

  buildTraces() {
    const events = readJsonHistory(this.rootDir, "memory/events", this.limit * 4).items.map((item) => item.data);
    const workerReports = readJsonHistory(this.rootDir, "memory/workers", this.limit).items.map((item) => item.data);
    const orchestrationReports = readJsonHistory(this.rootDir, "memory/orchestration", this.limit).items.map((item) => item.data);
    const transitionReports = readJsonHistory(this.rootDir, "memory/state-transitions", this.limit).items.map((item) => item.data);
    const decisionReports = readJsonHistory(this.rootDir, "memory/decisions", this.limit).items.map((item) => item.data);
    const traces = new Map();

    for (const event of events) {
      const workflow = normalizeWorkflowId(workflowOfEvent(event));
      if (!workflow) {
        continue;
      }
      const trace = this.ensureTrace(traces, workflow, event.correlationId);
      trace.events.push(event);
    }

    for (const report of workerReports) {
      for (const result of asArray(report.executionResults)) {
        const trace = this.ensureTrace(traces, normalizeWorkflowId(result.workflow), result.correlationId);
        trace.executions.push(result);
        if (result.workerId) {
          trace.workerAssignments.push({
            workerId: result.workerId,
            executionId: result.executionId,
            status: result.status,
            assignedAt: result.startedAt
          });
        }
      }
      for (const decision of asArray(report.decisions?.registered?.decisions)) {
        const workflow = normalizeWorkflowId(decision.evidence?.workflow || decision.evidence?.workflowId) || "runtime-operational-workflow";
        const trace = this.ensureTrace(traces, workflow, null);
        trace.decisions.push(decision);
      }
    }

    for (const report of orchestrationReports) {
      for (const assignment of asArray(report.distribution?.assignments)) {
        const trace = this.ensureTrace(traces, normalizeWorkflowId(assignment.workflow), null);
        trace.workerAssignments.push({
          workerId: assignment.workerId,
          queueId: assignment.queueId,
          source: "multi-worker-orchestrator"
        });
      }
      for (const rebalance of asArray(report.rebalance?.rebalances)) {
        const trace = this.ensureTrace(traces, normalizeWorkflowId(rebalance.workflow), null);
        trace.rebalances.push(rebalance);
      }
      for (const lease of asArray(report.leases)) {
        const trace = this.ensureTrace(traces, normalizeWorkflowId(lease.workflow), null);
        trace.leases.push(lease);
      }
      for (const result of asArray(report.executionResults)) {
        const trace = this.ensureTrace(traces, normalizeWorkflowId(result.workflow), result.correlationId);
        trace.executions.push(result);
      }
    }

    for (const report of transitionReports) {
      for (const transition of asArray(report.appliedTransitions)) {
        const trace = this.ensureTrace(traces, normalizeWorkflowId(transition.workflow), null);
        trace.transitions.push(transition);
      }
      for (const transition of asArray(report.blockedTransitions)) {
        const trace = this.ensureTrace(traces, normalizeWorkflowId(transition.workflow), null);
        trace.transitions.push({ ...transition, blocked: true });
      }
    }

    for (const report of decisionReports) {
      for (const decision of asArray(report.decisions)) {
        const workflow = normalizeWorkflowId(
          decision.evidence?.workflow
          || decision.evidence?.workflowId
          || decision.evidence?.guardedWorkflows?.[0]
        ) || "runtime-operational-workflow";
        const trace = this.ensureTrace(traces, workflow, null);
        trace.decisions.push(decision);
      }
    }

    return [...traces.values()].map((trace) => ({
      ...trace,
      correlationIds: [...trace.correlationIds].filter(Boolean),
      problemSignals: this.problemSignals(trace)
    }));
  }

  ensureTrace(traces, workflowId, correlationId) {
    if (!workflowId) {
      workflowId = "unknown-workflow";
    }

    if (!traces.has(workflowId)) {
      traces.set(workflowId, {
        workflowId,
        correlationIds: new Set(),
        executions: [],
        workerAssignments: [],
        transitions: [],
        decisions: [],
        events: [],
        rebalances: [],
        leases: []
      });
    }

    const trace = traces.get(workflowId);
    if (correlationId) {
      trace.correlationIds.add(correlationId);
    }
    return trace;
  }

  problemSignals(trace) {
    const signals = [];
    if (trace.executions.some((execution) => execution.status === "failed")) {
      signals.push("failed-execution");
    }
    if (trace.executions.some((execution) => execution.status === "waiting_worker")) {
      signals.push("waiting-worker");
    }
    if (trace.transitions.some((transition) => transition.to === "blocked" || transition.blocked)) {
      signals.push("blocked-transition");
    }
    if (trace.rebalances.length > 0) {
      signals.push("rebalanced");
    }
    if (trace.leases.some((lease) => lease.status === "expired")) {
      signals.push("expired-lease");
    }
    return signals;
  }
}

module.exports = {
  RuntimeTraceManager
};
