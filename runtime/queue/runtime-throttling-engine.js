class RuntimeThrottlingEngine {
  apply({ backpressure, pressure }) {
    const highSignals = backpressure.signals.filter((signal) => signal.severity === "high");
    const mode = highSignals.length > 0
      ? "aggressive"
      : backpressure.signals.length > 0
        ? "moderate"
        : "none";
    const concurrencyReduction = mode === "aggressive" ? 0.5 : mode === "moderate" ? 0.25 : 0;
    const slowdownMs = mode === "aggressive" ? 30000 : mode === "moderate" ? 10000 : 0;

    return {
      throttlingId: `queue_throttling_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      mode,
      applied: mode !== "none",
      readonly: true,
      concurrencyProtection: {
        reduceByRatio: concurrencyReduction,
        reason: mode === "none" ? "no-backpressure" : "backpressure-signals-detected"
      },
      saturationReduction: {
        holdLowPriorityAssignments: mode !== "none",
        preserveProtectedQueue: true,
        queueDepth: pressure.totalQueueItems
      },
      executionSlowdownRecommendation: {
        delayMs: slowdownMs,
        appliesTo: mode === "aggressive" ? ["normal", "low", "retry"] : mode === "moderate" ? ["low"] : []
      },
      safetyMode: "readonly-safe-queue-throttling"
    };
  }
}

module.exports = {
  RuntimeThrottlingEngine
};
