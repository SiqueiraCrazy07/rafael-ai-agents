class AdaptiveThrottlingOptimizer {
  optimize({ latestPredictive, latestProactive }) {
    const runtimeRisk = latestPredictive?.runtimeRisk?.riskScore || 0;
    const predictedHealth = latestPredictive?.predictiveHealth?.predictedHealthScore ?? 100;
    const proactiveThrottle = latestProactive?.actions?.find((action) => action.type === "predictive-throttling");

    const mode =
      runtimeRisk >= 90 || predictedHealth < 30
        ? "strict-conservative"
        : runtimeRisk >= 60
          ? "limited"
          : "normal";

    return {
      optimizer: "adaptive-throttling",
      currentMode: proactiveThrottle?.mode || "unknown",
      recommendedMode: mode,
      maxConcurrentExecutions: mode === "strict-conservative" ? 1 : mode === "limited" ? 2 : 3,
      releaseCondition:
        mode === "strict-conservative"
          ? "two consecutive forecasts below risk 60 and predicted health above 60"
          : "next forecast stable",
      reason: `runtimeRisk=${runtimeRisk}; predictedHealth=${predictedHealth}`
    };
  }
}

module.exports = {
  AdaptiveThrottlingOptimizer
};
