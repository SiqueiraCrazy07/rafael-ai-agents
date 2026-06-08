class StudentGuidanceEngine {
  generate(project) {
    return {
      guidanceId: `student_guidance_${project.projectSlug}`,
      orientation: [
        "show the next best activity",
        "explain the learning goal",
        "offer one hint before full correction"
      ],
      tips: [
        "read the prompt twice",
        "try without hints first",
        "use the feedback to retry",
        "review weak items before the next level"
      ],
      reinforcement: [
        "connect effort to mastery",
        "show what improved",
        "name the skill being practiced"
      ],
      coaching: [
        "plan a short practice session",
        "choose a review task",
        "set one achievable goal"
      ],
      encouragement: "supportive and specific, without false praise or pressure",
      readonly: true,
      safetyMode: "readonly-safe-student-guidance-engine"
    };
  }
}

module.exports = { StudentGuidanceEngine };
