class RecoveryRecommendationEngine {
  recommend({ incidents, retryPatterns }) {
    const recommendations = [];

    for (const incident of incidents) {
      const action = incident.severity === "high" || incident.severity === "critical"
        ? "human_review_required"
        : "monitor_and_retry_if_transient";

      recommendations.push({
        recommendationId: `recovery_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        createdAt: new Date().toISOString(),
        executionId: incident.executionId,
        workflow: incident.workflow,
        project: incident.project,
        severity: incident.severity,
        action,
        summary:
          action === "human_review_required"
            ? "Block autonomous recovery and require human review before retry or rollback."
            : "Retry may be allowed if the failure is transient and output validation passes.",
        requiredValidation: ["runtime-state-validation", "checkpoint-validation"],
        rollbackRecommended: incident.title.includes("rollback") || incident.severity === "high"
      });
    }

    for (const retry of retryPatterns.filter((item) => item.exhausted)) {
      recommendations.push({
        recommendationId: `recovery_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        createdAt: new Date().toISOString(),
        executionId: retry.executionId,
        workflow: retry.workflow,
        project: retry.project,
        severity: "high",
        action: "stop_retrying",
        summary: "Retry limit exhausted. Stop automatic retries and inspect root cause.",
        requiredValidation: ["human-validation"],
        rollbackRecommended: false
      });
    }

    return recommendations;
  }
}

module.exports = {
  RecoveryRecommendationEngine
};
