class PredictiveHealthAnalyzer {
  analyze({ runtimeRisk, incidentForecast, memory }) {
    const healthScores = memory.healthReports
      .map((item) => item.data.platformHealthScore)
      .filter((score) => typeof score === "number");
    const latestHealth = healthScores.at(-1) ?? 100;
    const averageHealth =
      healthScores.length > 0
        ? Math.round(healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length)
        : 100;
    const degradationPenalty = incidentForecast.trend === "degrading" ? 15 : 0;
    const predictedHealthScore = Math.max(0, latestHealth - Math.round(runtimeRisk.riskScore / 4) - degradationPenalty);

    return {
      latestHealth,
      averageHealth,
      predictedHealthScore,
      status:
        predictedHealthScore < 30
          ? "critical"
          : predictedHealthScore < 60
            ? "degraded"
            : predictedHealthScore < 80
              ? "watch"
              : "healthy"
    };
  }
}

module.exports = {
  PredictiveHealthAnalyzer
};
