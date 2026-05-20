class RouterTelemetry {
  summarize({ queueItem, routingDecision, plan, graph }) {
    return {
      event: "routing_decision",
      generatedAt: new Date().toISOString(),
      project: queueItem.project,
      workflow: queueItem.workflow,
      queueId: queueItem.queueId,
      selectedAgent: routingDecision.selectedAgent,
      candidates: routingDecision.candidates.length,
      planId: plan.planId,
      graphId: graph.graphId,
      status: routingDecision.status,
      gates: plan.gates || []
    };
  }
}

module.exports = {
  RouterTelemetry
};
