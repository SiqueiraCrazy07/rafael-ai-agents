class PredictiveRoutingEnforcer {
  enforce(forecast) {
    const routing = forecast.recommendations?.routing;
    if (!routing?.reroutingRecommended) {
      return [];
    }

    return [
      ...routing.avoidWorkers.map((worker) => ({
        type: "predictive-rerouting",
        status: "applied",
        targetType: "worker",
        target: worker.workerId,
        action: worker.action,
        reason: worker.reason
      })),
      ...routing.guardedWorkflows.map((workflow) => ({
        type: "predictive-rerouting",
        status: "applied",
        targetType: "workflow",
        target: workflow.workflow,
        action: workflow.action,
        reason: workflow.reason
      }))
    ];
  }
}

module.exports = {
  PredictiveRoutingEnforcer
};
