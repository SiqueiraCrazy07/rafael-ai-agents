class HistoricalStabilityAnalyzer {
  analyze(memory) {
    const platformScores = memory.healthReports
      .map((item) => item.data.platformHealthScore)
      .filter((score) => Number.isFinite(score));

    const averageHealth =
      platformScores.reduce((sum, score) => sum + score, 0) / Math.max(1, platformScores.length);

    return {
      samples: platformScores.length,
      averagePlatformHealth: Math.round(averageHealth),
      trend:
        platformScores.length < 2
          ? "insufficient-data"
          : platformScores[platformScores.length - 1] >= platformScores[0]
            ? "stable-or-improving"
            : "degrading"
    };
  }
}

module.exports = {
  HistoricalStabilityAnalyzer
};
