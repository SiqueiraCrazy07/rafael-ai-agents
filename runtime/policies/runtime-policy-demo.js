const { RuntimePolicyEngine } = require("./runtime-policy-engine");

function runRuntimePolicyDemo() {
  const result = new RuntimePolicyEngine().run();

  console.log(
    JSON.stringify(
      {
        decisionId: result.decisionId,
        status: result.status,
        policiesTriggered: result.policiesTriggered,
        blockedWorkflows: result.blockedWorkflows,
        penalizedAgents: result.penalizedAgents,
        throttlingApplied: result.throttlingApplied,
        rollbackRecommended: result.rollbackRecommended,
        humanGatesRequired: result.humanGatesRequired,
        source: result.source,
        persistence: result.persistence
      },
      null,
      2
    )
  );
}

runRuntimePolicyDemo();
