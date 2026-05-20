class ForecastEnforcementPolicyEngine {
  evaluate(forecast) {
    const runtimeRisk = forecast.runtimeRisk?.riskScore || 0;
    const predictedHealth = forecast.predictiveHealth?.predictedHealthScore ?? 100;
    const criticalWorkflows = forecast.criticalWorkflows?.length || 0;
    const saturatedWorkers = forecast.saturatedWorkers?.filter((worker) =>
      ["critical", "high"].includes(worker.forecast)
    ).length || 0;

    return {
      enforcementLevel:
        runtimeRisk >= 90 || predictedHealth < 30
          ? "strict"
          : runtimeRisk >= 70
            ? "guarded"
            : "observe",
      allowAutomaticThrottling: runtimeRisk >= 60 || predictedHealth < 60,
      allowWorkflowBlocking: criticalWorkflows > 0,
      allowPreventiveRerouting: saturatedWorkers > 0,
      requireHumanGate: predictedHealth < 60 || criticalWorkflows > 0,
      allowPreventiveRecovery: runtimeRisk >= 80 || saturatedWorkers > 0,
      signals: {
        runtimeRisk,
        predictedHealth,
        criticalWorkflows,
        saturatedWorkers
      }
    };
  }
}

module.exports = {
  ForecastEnforcementPolicyEngine
};
