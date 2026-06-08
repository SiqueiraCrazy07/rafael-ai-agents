class ConversationSimulationEngine {
  generate(project) {
    const english = project.projectSlug.includes("english") || project.productName.toLowerCase().includes("english");
    return {
      conversationSimulationId: `conversation_simulation_${project.projectSlug}`,
      dialogs: english ? [
        { tutor: "Hi. What did you practice today?", learner: "I practiced vocabulary.", followUp: "Use one new word in a sentence." },
        { tutor: "Let's roleplay ordering something.", learner: "I would like...", followUp: "Now change the item and repeat." }
      ] : [
        { tutor: "Tell me how you solved it.", learner: "I tried this step.", followUp: "What would you change next time?" },
        { tutor: "Let's review the rule.", learner: "The rule is...", followUp: "Apply it to a new example." }
      ],
      scenarios: english ? ["greeting", "ordering", "asking for help", "daily routine"] : ["concept review", "challenge retry", "mission reflection"],
      roleplay: english ? ["traveler and guide", "student and teacher", "customer and attendant"] : ["coach and learner", "peer explainer"],
      contextualPractice: "scenario difficulty adapts from mastery and error pattern",
      readonly: true,
      externalAiUsed: false,
      safetyMode: "readonly-safe-conversation-simulation-engine"
    };
  }
}

module.exports = { ConversationSimulationEngine };
