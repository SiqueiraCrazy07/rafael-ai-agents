class EventCorrelationEngine {
  constructor() {
    this.byWorkflow = new Map();
    this.byCorrelation = new Map();
    this.byTrace = new Map();
  }

  enrich(input) {
    const timestamp = input.timestamp || new Date().toISOString();
    const workflowId = input.workflowId || "runtime-event-workflow";
    const correlationId = input.correlationId || `correlation_${workflowId}_${Date.now()}`;
    const executionId = input.executionId || `execution_${workflowId}_${Date.now()}`;
    const distributedTraceId = input.distributedTraceId || input.traceId || `trace_${correlationId}`;
    return {
      ...input,
      timestamp,
      workflowId,
      correlationId,
      executionId,
      trace: {
        distributedTraceId,
        parentEventId: input.parentEventId || null,
        workflowChain: input.workflowChain || [workflowId]
      }
    };
  }

  record(event) {
    this.push(this.byWorkflow, event.workflowId, event.eventId);
    this.push(this.byCorrelation, event.correlationId, event.eventId);
    this.push(this.byTrace, event.trace.distributedTraceId, event.eventId);
    return this.traceFor(event);
  }

  push(map, key, value) {
    const values = map.get(key) || [];
    values.push(value);
    map.set(key, values);
  }

  traceFor(event) {
    return {
      workflowId: event.workflowId,
      correlationId: event.correlationId,
      executionId: event.executionId,
      distributedTraceId: event.trace.distributedTraceId,
      workflowChain: event.trace.workflowChain,
      eventIdsForWorkflow: this.byWorkflow.get(event.workflowId) || [],
      eventIdsForCorrelation: this.byCorrelation.get(event.correlationId) || [],
      eventIdsForTrace: this.byTrace.get(event.trace.distributedTraceId) || []
    };
  }

  summary() {
    return {
      workflows: this.byWorkflow.size,
      correlations: this.byCorrelation.size,
      distributedTraces: this.byTrace.size
    };
  }
}

module.exports = {
  EventCorrelationEngine
};
