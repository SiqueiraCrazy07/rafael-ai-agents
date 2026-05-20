class RuntimeForecastEngine {
  generate({
    workflowPredictions,
    workerPredictions,
    incidentForecast,
    runtimeRisk,
    predictiveHealth,
    routingAdvice,
    throttling
  }) {
    return {
      forecastWindow: "next-operational-window",
      generatedAt: new Date().toISOString(),
      degradationTrend: incidentForecast.trend,
      criticalWorkflows: workflowPredictions.filter((workflow) => workflow.forecast === "critical"),
      saturatedWorkers: workerPredictions.filter((worker) => ["critical", "high"].includes(worker.forecast)),
      incidentForecast,
      runtimeRisk,
      predictiveHealth,
      recommendations: {
        throttling,
        routing: routingAdvice,
        actions: this.buildActions({ runtimeRisk, predictiveHealth, routingAdvice, throttling })
      }
    };
  }

  buildActions({ runtimeRisk, predictiveHealth, routingAdvice, throttling }) {
    const actions = [];

    if (throttling.recommended) {
      actions.push({
        type: "preventive-throttling",
        priority: runtimeRisk.status === "critical" ? "high" : "medium",
        action: `Apply ${throttling.mode} with maxConcurrentExecutions=${throttling.maxConcurrentExecutions}`,
        reason: throttling.reason
      });
    }

    if (routingAdvice.reroutingRecommended) {
      actions.push({
        type: "preventive-rerouting",
        priority: "high",
        action: "Avoid saturated workers and require guarded workflows to use healthy alternatives.",
        reason: `${routingAdvice.avoidWorkers.length} workers and ${routingAdvice.guardedWorkflows.length} workflows flagged`
      });
    }

    if (predictiveHealth.status === "critical") {
      actions.push({
        type: "human-gate",
        priority: "high",
        action: "Require human validation before critical workflow execution.",
        reason: `predictedHealthScore=${predictiveHealth.predictedHealthScore}`
      });
    }

    return actions;
  }
}

module.exports = {
  RuntimeForecastEngine
};
