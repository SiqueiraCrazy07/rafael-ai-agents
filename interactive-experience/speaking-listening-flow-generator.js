class SpeakingListeningFlowGenerator {
  generate(project) {
    const enabled = project.projectSlug.includes("english") || project.productName.toLowerCase().includes("english");
    return {
      speakingListeningId: `speaking_listening_${project.projectSlug}`,
      enabled,
      listeningPractice: enabled ? ["listen to phrase", "choose meaning", "repeat after delay"] : [],
      speakingPrompt: enabled ? ["read prompt", "speak placeholder", "self-check pronunciation prompt"] : [],
      pronunciationPlaceholder: enabled ? "no speech engine in V1; plan-only placeholder" : "not required",
      repetitionLoop: enabled ? ["listen", "speak", "compare", "repeat weak phrase"] : [],
      conversationPractice: enabled ? ["greeting", "short response", "follow-up", "recap vocabulary"] : [],
      vocabularyRecall: enabled ? ["see meaning", "recall word", "use in phrase"] : [],
      phraseBuilder: enabled ? ["choose subject", "choose verb", "choose context", "speak/read sentence"] : [],
      readonly: true,
      mediaGenerated: false,
      safetyMode: "readonly-safe-speaking-listening-flow-generator"
    };
  }
}

module.exports = { SpeakingListeningFlowGenerator };
