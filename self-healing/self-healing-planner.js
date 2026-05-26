class SelfHealingPlanner {
  buildPlan({ classifications = [], checkpointRecovery = null, replay = null } = {}) {
    const recommendations = [];
    for (const classification of classifications) {
      recommendations.push(...this.recommendFor(classification));
    }

    if (checkpointRecovery?.latest) {
      recommendations.push({
        type: "replay recommendation",
        action: "replay-from-latest-valid-checkpoint",
        severity: "medium",
        reason: "valid checkpoint available",
        evidence: { checkpointId: checkpointRecovery.latest.checkpointId },
        readonly: true
      });
    }

    if (replay?.validation?.warnings?.length || replay?.loaded?.events === 0) {
      recommendations.push({
        type: "escalation recommendation",
        action: "request-human-review-for-replay-inconsistency",
        severity: "high",
        reason: "replay warnings or missing events detected",
        evidence: { warnings: replay.validation?.warnings || [], loaded: replay.loaded || {} },
        readonly: true
      });
    }

    const unique = new Map(recommendations.map((item) => [`${item.type}:${item.action}:${item.reason}`, item]));
    return {
      selfHealingPlanId: `self_healing_plan_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      generatedAt: new Date().toISOString(),
      readonly: true,
      destructiveActions: false,
      executeRecovery: false,
      recommendations: [...unique.values()],
      safetyMode: "readonly-safe-self-healing-plan",
      humanGateRequired: [...unique.values()].some((item) => item.severity === "high")
    };
  }

  recommendFor(classification) {
    const common = {
      severity: classification.severity,
      evidence: classification.evidence,
      readonly: true
    };
    switch (classification.failureType) {
      case "timeout":
        return [
          { ...common, type: "retry recommendation", action: "schedule-controlled-retry-with-backoff", reason: classification.reason },
          { ...common, type: "replay recommendation", action: "run-readonly-replay-before-retry", reason: classification.reason }
        ];
      case "worker unavailable":
        return [
          { ...common, type: "reroute recommendation", action: "reroute-to-healthy-worker", reason: classification.reason },
          { ...common, type: "worker isolation recommendation", action: "isolate-unhealthy-worker", reason: classification.reason }
        ];
      case "queue overload":
        return [
          { ...common, type: "queue protection recommendation", action: "move-workflow-to-protected-queue", reason: classification.reason },
          { ...common, type: "retry recommendation", action: "delay-retries-until-queue-pressure-drops", reason: classification.reason }
        ];
      case "invalid state transition":
      case "checkpoint corruption":
      case "replay inconsistency":
        return [
          { ...common, type: "escalation recommendation", action: "require-human-gate", reason: classification.reason },
          { ...common, type: "replay recommendation", action: "generate-readonly-replay-evidence", reason: classification.reason }
        ];
      default:
        return [
          { ...common, type: "escalation recommendation", action: "supervised-review", reason: classification.reason }
        ];
    }
  }
}

module.exports = {
  SelfHealingPlanner
};
