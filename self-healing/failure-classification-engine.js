class FailureClassificationEngine {
  classify(signal) {
    const reason = String(signal.reason || signal.message || signal.type || "").toLowerCase();
    const evidence = signal.evidence || {};
    let failureType = "dependency failure";

    if (signal.type === "event-stream-gap" || reason.includes("replay") || reason.includes("timeline") || reason.includes("gap")) {
      failureType = "replay inconsistency";
    } else if (signal.type === "checkpoint-inconsistency" || reason.includes("checkpoint") || reason.includes("corruption")) {
      failureType = "checkpoint corruption";
    } else if (signal.type === "workflow-stalled" || reason.includes("transition") || reason.includes("state")) {
      failureType = "invalid state transition";
    } else if (signal.type === "queue-saturation" || reason.includes("queue") || reason.includes("saturation") || reason.includes("overload")) {
      failureType = "queue overload";
    } else if (reason.includes("timeout") || evidence.failureType === "timeout") {
      failureType = "timeout";
    } else if (reason.includes("unhealthy") || reason.includes("worker") || evidence.workerId) {
      failureType = "worker unavailable";
    }

    return {
      classificationId: `failure_classification_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      signalId: signal.signalId,
      failureType,
      severity: signal.severity || this.severityFor(failureType),
      retryEligible: ["timeout", "worker unavailable", "queue overload", "dependency failure"].includes(failureType),
      source: signal.source || "runtime-health-monitor",
      evidence,
      reason: signal.reason || `classified-as-${failureType}`,
      safetyMode: "readonly-safe-failure-classification"
    };
  }

  classifyMany(signals) {
    return signals.map((signal) => this.classify(signal));
  }

  severityFor(failureType) {
    if (["checkpoint corruption", "replay inconsistency", "invalid state transition"].includes(failureType)) {
      return "high";
    }
    if (["worker unavailable", "queue overload", "timeout"].includes(failureType)) {
      return "medium";
    }
    return "low";
  }
}

module.exports = {
  FailureClassificationEngine
};
