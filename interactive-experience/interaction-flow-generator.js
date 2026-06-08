class InteractionFlowGenerator {
  generate(project) {
    return {
      flowId: `interaction_flows_${project.projectSlug}`,
      onboarding: ["choose goal", "complete sample interaction", "see first reward", "start mission"],
      exercise: ["read prompt", "interact", "submit", "receive feedback", "retry or continue"],
      review: ["surface weak item", "recall", "compare feedback", "schedule next review"],
      reward: ["show XP", "update progress", "show unlock", "offer next mission"],
      returnAfterError: ["explain mistake", "reduce difficulty", "offer guided retry", "restore confidence"],
      readonly: true,
      safetyMode: "readonly-safe-interaction-flow-generator"
    };
  }
}

module.exports = { InteractionFlowGenerator };
