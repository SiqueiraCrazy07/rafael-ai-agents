class PredictiveThrottlingEngine {
  recommend({ runtimeRisk, predictiveHealth, workflowPredictions }) {
    const criticalWorkflows = workflowPredictions
      .filter((workflow) => workflow.forecast === "critical")
      .map((workflow) => workflow.workflow);

    if (runtimeRisk.status === "critical" || predictiveHealth.status === "critical") {
      return {
        recommended: true,
        mode: "preventive-conservative",
        maxConcurrentExecutions: 1,
        requireCheckpointBeforeHandoff: true,
        workflows: criticalWorkflows,
        reason: `runtimeRisk=${runtimeRisk.riskScore}; predictedHealth=${predictiveHealth.predictedHealthScore}`
      };
    }

    if (runtimeRisk.status === "high" || predictiveHealth.status === "degraded") {
      return {
        recommended: true,
        mode: "preventive-limited",
        maxConcurrentExecutions: 2,
        requireCheckpointBeforeHandoff: true,
        workflows: criticalWorkflows,
        reason: `runtimeRisk=${runtimeRisk.riskScore}; predictedHealth=${predictiveHealth.predictedHealthScore}`
      };
    }

    return {
      recommended: false,
      mode: "normal",
      maxConcurrentExecutions: null,
      requireCheckpointBeforeHandoff: false,
      workflows: criticalWorkflows,
      reason: "predictive risk below throttling threshold"
    };
  }
}

module.exports = {
  PredictiveThrottlingEngine
};
