class RuntimeRiskPredictor {
  predict({ workflowPredictions, workerPredictions, incidentForecast, memory }) {
    const criticalWorkflows = workflowPredictions.filter((item) => item.forecast === "critical").length;
    const highWorkers = workerPredictions.filter((item) => ["critical", "high"].includes(item.forecast)).length;
    const latestPolicy = memory.policyDecisions.at(-1)?.data;
    const platformThrottle = latestPolicy?.throttlingApplied?.some((item) => item.target === "platform");
    const recoveryPressure = Math.min(30, memory.runtimeRecoveries.length * 10);

    const riskScore = Math.min(
      100,
      criticalWorkflows * 25 +
        highWorkers * 20 +
        (incidentForecast.forecast === "critical" ? 25 : incidentForecast.forecast === "high" ? 15 : 5) +
        (platformThrottle ? 20 : 0) +
        recoveryPressure
    );

    return {
      riskScore,
      status: riskScore >= 80 ? "critical" : riskScore >= 60 ? "high" : riskScore >= 35 ? "elevated" : "normal",
      signals: {
        criticalWorkflows,
        highWorkers,
        incidentForecast: incidentForecast.forecast,
        platformThrottle: Boolean(platformThrottle),
        recoveryReports: memory.runtimeRecoveries.length
      }
    };
  }
}

module.exports = {
  RuntimeRiskPredictor
};
