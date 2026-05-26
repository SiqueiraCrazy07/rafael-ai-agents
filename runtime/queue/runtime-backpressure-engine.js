class RuntimeBackpressureEngine {
  detect({ pressure, clusterState = null, failures = [] }) {
    const signals = [];
    if (pressure.totalQueueItems >= 4 || pressure.maxDepth >= 4) {
      signals.push(this.signal("queue-overload", "high queue depth detected", "high", {
        totalQueueItems: pressure.totalQueueItems,
        maxDepth: pressure.maxDepth
      }));
    }
    if (pressure.totalRetryItems >= 2 || pressure.retryRatio >= 0.5) {
      signals.push(this.signal("retry-storm", "retry volume may create storm", "high", {
        totalRetryItems: pressure.totalRetryItems,
        retryRatio: pressure.retryRatio
      }));
    }
    if (pressure.executionPressure >= 2) {
      signals.push(this.signal("execution-congestion", "cluster execution pressure is elevated", "medium", {
        executionPressure: pressure.executionPressure
      }));
    }
    if ((clusterState?.workers?.active || 0) === 0 || failures.some((failure) => failure.type === "worker-isolation")) {
      signals.push(this.signal("worker-starvation", "healthy worker capacity is limited", "high", {
        activeWorkers: clusterState?.workers?.active || 0
      }));
    }
    if (pressure.replayPressure > 0) {
      signals.push(this.signal("replay-pressure", "replay warnings add runtime pressure", "medium", {
        replayPressure: pressure.replayPressure
      }));
    }

    return {
      backpressureId: `backpressure_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      status: signals.length > 0 ? "backpressure-detected" : "normal",
      severity: signals.some((signal) => signal.severity === "high") ? "high" : signals.length > 0 ? "medium" : "low",
      signals,
      safetyMode: "readonly-safe-backpressure"
    };
  }

  signal(type, reason, severity, evidence) {
    return {
      signalId: `backpressure_signal_${type}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      type,
      severity,
      reason,
      evidence,
      recommendation: this.recommend(type),
      safetyMode: "readonly-safe-backpressure-signal"
    };
  }

  recommend(type) {
    const map = {
      "queue-overload": "throttle-new-assignments-and-preserve-protected-queue",
      "retry-storm": "increase-retry-delay-and-require-escalation-for-critical-retries",
      "execution-congestion": "reduce-concurrency-and-delay-low-priority-work",
      "worker-starvation": "avoid-assignment-and-request-human-gate",
      "replay-pressure": "delay-replay-heavy-workflows"
    };
    return map[type] || "supervised-review";
  }
}

module.exports = {
  RuntimeBackpressureEngine
};
