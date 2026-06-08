class StudentMemoryEngine {
  generate(project) {
    return {
      studentMemoryId: `student_memory_${project.projectSlug}`,
      persistenceTarget: "memory/ai-tutor",
      history: ["sessions", "conversation summaries", "completed tutor flows"],
      difficulties: ["missed skills", "repeated misconceptions", "low-confidence items"],
      progress: ["mastery checkpoints", "completed missions", "review recovery"],
      reviews: ["scheduled review", "completed review", "overdue review"],
      mastery: ["current domain", "threshold evidence", "next unlock"],
      jsonFallback: true,
      readonly: true,
      safetyMode: "readonly-safe-student-memory-engine"
    };
  }
}

module.exports = { StudentMemoryEngine };
