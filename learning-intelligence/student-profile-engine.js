class StudentProfileEngine {
  create({ project }) {
    const isChildFocused = project.category === "game";
    const ageBand = isChildFocused ? "8-13" : project.category === "education" ? "14-adult" : "general";
    const retentionRisk = project.curriculumGenerated ? "medium" : "low";
    return {
      profileId: `student_profile_${project.projectSlug}`,
      product: project.projectSlug,
      ageBand,
      difficulty: project.category === "game" ? "introductory" : "adaptive",
      pace: isChildFocused ? "short-session" : "self-paced",
      retentionRisk,
      learningStyle: ["visual", "practice-first", "feedback-driven"],
      signals: {
        age: ageBand,
        speed: isChildFocused ? "fast feedback loops" : "measured progression",
        retention: retentionRisk,
        frustrationTolerance: isChildFocused ? "low" : "medium"
      },
      readonly: true,
      safetyMode: "readonly-safe-student-profile-engine"
    };
  }
}

module.exports = { StudentProfileEngine };
