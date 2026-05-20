class OptimizationRecommendationEngine {
  generate({ concurrency, retry, balancing, queue, throttling, latestPredictive }) {
    const recommendations = [];

    recommendations.push({
      type: "concurrency",
      priority: concurrency.recommendedLimit < concurrency.currentLimit ? "high" : "medium",
      recommendation: `Set maxConcurrentExecutions to ${concurrency.recommendedLimit}`,
      reason: concurrency.reason
    });

    for (const item of balancing.recommendedRebalance) {
      recommendations.push({
        type: "worker-balancing",
        priority: item.action === "hold-and-throttle" ? "high" : "medium",
        recommendation: `${item.action} from ${item.from}`,
        reason: item.reason
      });
    }

    for (const bottleneck of queue.bottlenecks) {
      recommendations.push({
        type: "queue",
        priority: "high",
        recommendation: bottleneck.recommendation,
        reason: `${bottleneck.type}:${bottleneck.count}`
      });
    }

    recommendations.push({
      type: "throttling",
      priority: throttling.recommendedMode === "strict-conservative" ? "high" : "medium",
      recommendation: `Use ${throttling.recommendedMode}`,
      reason: throttling.reason
    });

    if (latestPredictive?.runtimeRisk?.status === "critical") {
      recommendations.push({
        type: "risk",
        priority: "high",
        recommendation: "Keep proactive enforcement enabled until risk drops below high.",
        reason: `runtimeRisk=${latestPredictive.runtimeRisk.riskScore}`
      });
    }

    return recommendations;
  }
}

module.exports = {
  OptimizationRecommendationEngine
};
