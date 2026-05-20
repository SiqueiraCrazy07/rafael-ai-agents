function eventTime(value) {
  return value || new Date(0).toISOString();
}

class RuntimeTimelineBuilder {
  buildTimeline(trace) {
    const entries = [];

    for (const event of trace.events || []) {
      entries.push({
        at: event.timestamp,
        stage: this.stageFromEvent(event.type),
        source: "event-bus",
        eventId: event.eventId,
        detail: event.type
      });
    }

    for (const assignment of trace.workerAssignments || []) {
      entries.push({
        at: assignment.assignedAt || new Date().toISOString(),
        stage: "assigned",
        source: assignment.source || "worker-runtime",
        workerId: assignment.workerId,
        executionId: assignment.executionId || null,
        detail: "worker assignment"
      });
    }

    for (const execution of trace.executions || []) {
      entries.push({
        at: execution.startedAt || execution.completedAt || new Date().toISOString(),
        stage: "executing",
        source: "worker-execution",
        executionId: execution.executionId,
        workerId: execution.workerId,
        detail: execution.status
      });
      entries.push({
        at: execution.completedAt || execution.startedAt || new Date().toISOString(),
        stage: execution.status === "completed" ? "completed" : execution.status === "failed" ? "failed" : execution.status,
        source: "worker-execution",
        executionId: execution.executionId,
        workerId: execution.workerId,
        detail: execution.error || execution.status
      });
    }

    for (const transition of trace.transitions || []) {
      entries.push({
        at: transition.transitionedAt || new Date().toISOString(),
        stage: transition.to || "transition",
        source: transition.source || "state-machine",
        transitionId: transition.transitionId || null,
        detail: transition.reason || transition.decisionType || "state transition"
      });
    }

    for (const rebalance of trace.rebalances || []) {
      entries.push({
        at: new Date().toISOString(),
        stage: "rerouted",
        source: "rebalance-engine",
        detail: `${rebalance.fromWorkerId} -> ${rebalance.toWorkerId}`,
        queueId: rebalance.queueId
      });
    }

    const sorted = entries.sort((left, right) => eventTime(left.at).localeCompare(eventTime(right.at)));
    return {
      workflowId: trace.workflowId,
      correlationIds: trace.correlationIds || [],
      entries: sorted,
      stages: [...new Set(sorted.map((entry) => entry.stage))],
      problemSignals: trace.problemSignals || []
    };
  }

  buildTimelines(traces) {
    return traces.map((trace) => this.buildTimeline(trace));
  }

  stageFromEvent(type) {
    const map = {
      "workflow-queued": "queued",
      "worker-lease-created": "assigned",
      "worker-lease-expired": "lease-expired",
      "workflow-paused": "paused",
      "workflow-rerouted": "rerouted",
      "workflow-throttled": "throttled",
      "workflow-recovering": "recovering",
      "workflow-quarantined": "quarantined",
      "enforcement-applied": "retrying",
      "workflow-rebalanced": "rerouted",
      "workflow-completed": "completed",
      "workflow-failed": "failed"
    };
    return map[type] || type;
  }
}

module.exports = {
  RuntimeTimelineBuilder
};
