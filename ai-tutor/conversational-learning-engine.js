class ConversationalLearningEngine {
  generate(project) {
    return {
      conversationalLearningId: `conversational_learning_${project.projectSlug}`,
      practice: [
        "ask learner to explain the concept in their own words",
        "respond with a short scaffolded follow-up",
        "ask one transfer question",
        "close with a review prompt"
      ],
      questions: [
        `What did you notice in this ${project.productName} activity?`,
        "Which part felt easy?",
        "Which part should we practice again?",
        "Can you try a similar example without hints?"
      ],
      responses: [
        "I will guide you one step at a time.",
        "Good attempt. Let's connect this answer to the rule.",
        "Let's review the weak part before moving forward."
      ],
      followUps: [
        "try a shorter version",
        "explain your reasoning",
        "compare two possible answers",
        "repeat after feedback"
      ],
      contextualReinforcement: "connect each response to the current skill, mission and mastery target",
      readonly: true,
      externalAiUsed: false,
      safetyMode: "readonly-safe-conversational-learning-engine"
    };
  }
}

module.exports = { ConversationalLearningEngine };
