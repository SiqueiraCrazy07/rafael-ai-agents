class IncidentForecastEngine {
  forecast(memory) {
    const recentIncidents = memory.incidents.slice(-10);
    const highSeverity = recentIncidents.filter((item) => item.data.severity === "high").length;
    const mediumSeverity = recentIncidents.filter((item) => item.data.severity === "medium").length;
    const total = recentIncidents.length;
    const projectedNextWindow = Math.max(
      total,
      Math.round(total + highSeverity * 0.8 + memory.runtimeRecoveries.length * 0.5)
    );

    return {
      recentWindowSize: total,
      highSeverity,
      mediumSeverity,
      projectedNextWindow,
      trend:
        projectedNextWindow > total ? "degrading" : total > 0 ? "stable-risk" : "insufficient-data",
      forecast:
        projectedNextWindow >= 10 || highSeverity >= 3
          ? "critical"
          : projectedNextWindow >= 5
            ? "high"
            : projectedNextWindow >= 2
              ? "elevated"
              : "normal"
    };
  }
}

module.exports = {
  IncidentForecastEngine
};
