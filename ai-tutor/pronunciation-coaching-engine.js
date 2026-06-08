class PronunciationCoachingEngine {
  generate(project) {
    const enabled = project.projectSlug.includes("english") || project.productName.toLowerCase().includes("english");
    return {
      pronunciationCoachingId: `pronunciation_coaching_${project.projectSlug}`,
      enabled,
      speakingPrompts: enabled ? [
        "repeat the phrase slowly",
        "say the phrase in a short answer",
        "use the new word in your own sentence"
      ] : [],
      phoneticGuidance: enabled ? [
        "stress the key syllable",
        "notice the vowel sound",
        "compare short and long sounds"
      ] : [],
      pronunciationCheckpoints: enabled ? [
        "listen and repeat",
        "self-check clarity",
        "repeat weak phrase after feedback"
      ] : [],
      repetitionLoops: enabled ? ["hear", "repeat", "self-check", "retry", "use in conversation"] : [],
      placeholderOnly: true,
      voiceProcessingExecuted: false,
      readonly: true,
      safetyMode: "readonly-safe-pronunciation-coaching-engine"
    };
  }
}

module.exports = { PronunciationCoachingEngine };
