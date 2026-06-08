class MinigameGenerator {
  generate(project) {
    const base = [
      { subject: "matematica", name: "Number Sprint", mechanic: "solve quick problems before timer pressure rises" },
      { subject: "portugues", name: "Sentence Builder", mechanic: "assemble words into clear sentences" },
      { subject: "ingles", name: "Phrase Match", mechanic: "match audio/text prompts to meaning" },
      { subject: "memoria", name: "Recall Cards", mechanic: "flip and recall concepts with spaced review" },
      { subject: "leitura", name: "Reading Path", mechanic: "choose the sentence that completes the idea" },
      { subject: "escrita", name: "Write It", mechanic: "complete short written responses with feedback" },
      { subject: "logica", name: "Pattern Gate", mechanic: "find rules and unlock the next challenge" }
    ];
    return {
      minigameId: `minigames_${project.projectSlug}`,
      recommended: base.filter((game) => project.category === "game" || project.category === "education" || game.subject !== "matematica").map((game, index) => ({
        ...game,
        order: index + 1,
        completionCriteria: "finish challenge with mastery threshold or guided retry",
        adaptiveHook: "difficulty changes from accuracy and response time"
      })),
      readonly: true,
      mediaGenerated: false,
      safetyMode: "readonly-safe-minigame-generator"
    };
  }
}

module.exports = { MinigameGenerator };
