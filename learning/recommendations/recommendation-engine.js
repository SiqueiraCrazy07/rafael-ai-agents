class RecommendationEngine {
  generate({ agentReliability, workflowRisks, recoveryEffectiveness, historicalStability }) {
    const recommendations = [];

    for (const agent of agentReliability.filter((item) => item.status === "unstable")) {
      recommendations.push({
        type: "agent-reliability",
        priority: "high",
        target: agent.agentId,
        recommendation: "Reduce routing preference and require validation before critical workflows.",
        evidence: `reliabilityScore=${agent.reliabilityScore}`
      });
    }

    for (const workflow of workflowRisks.filter((item) => item.status !== "normal")) {
      recommendations.push({
        type: "workflow-risk",
        priority: workflow.status === "critical" ? "high" : "medium",
        target: workflow.workflow,
        recommendation: "Add checkpoint and human gate before execution.",
        evidence: `riskScore=${workflow.riskScore}`
      });
    }

    if (recoveryEffectiveness.rollbackRecommended > 0) {
      recommendations.push({
        type: "recovery",
        priority: "medium",
        target: "recovery-policy",
        recommendation: "Review rollback recommendations and convert recurring cases into policy rules.",
        evidence: `rollbackRecommended=${recoveryEffectiveness.rollbackRecommended}`
      });
    }

    if (historicalStability.averagePlatformHealth < 75) {
      recommendations.push({
        type: "platform-health",
        priority: "high",
        target: "platform",
        recommendation: "Keep adaptive routing enabled and prioritize stabilization before automation expansion.",
        evidence: `averagePlatformHealth=${historicalStability.averagePlatformHealth}`
      });
    }

    return recommendations;
  }
}

module.exports = {
  RecommendationEngine
};
