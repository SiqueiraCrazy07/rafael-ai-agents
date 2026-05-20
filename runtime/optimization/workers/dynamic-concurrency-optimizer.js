class DynamicConcurrencyOptimizer {
  optimize({ latestQueue, latestPredictive, latestProactive }) {
    const currentLimit = latestQueue?.metrics?.throttling?.maxConcurrentExecutions || 1;
    const risk = latestPredictive?.runtimeRisk?.riskScore || 0;
    const proactiveStrict = latestProactive?.policy?.enforcementLevel === "strict";
    const completed = latestQueue?.metrics?.completed || 0;
    const failed = latestQueue?.metrics?.failed || 0;
    const failureRate = failed / Math.max(1, completed + failed);

    let recommended = currentLimit;
    let mode = "hold";

    if (risk >= 80 || proactiveStrict || failureRate >= 0.25) {
      recommended = 1;
      mode = "protective-minimum";
    } else if (risk < 40 && failureRate < 0.1) {
      recommended = Math.min(4, currentLimit + 1);
      mode = "careful-increase";
    }

    return {
      optimizer: "dynamic-concurrency",
      currentLimit,
      recommendedLimit: recommended,
      mode,
      reason: `risk=${risk}; failureRate=${failureRate.toFixed(2)}; proactiveStrict=${proactiveStrict}`
    };
  }
}

module.exports = {
  DynamicConcurrencyOptimizer
};
