const EDUCATION_METHODS = [
  "active recall",
  "spaced repetition",
  "interleaving",
  "scaffolding",
  "mastery learning",
  "gamification",
  "adaptive learning"
];

class ProductCurriculumGenerator {
  generate({ productPlan }) {
    const isEducational = productPlan.classification.categories.includes("education") || productPlan.classification.categories.includes("game");
    if (!isEducational) {
      return {
        curriculumId: `product_curriculum_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
        generated: false,
        reason: "non-educational-product",
        levels: [],
        modules: [],
        readonly: true,
        fallback: { safeMode: true, reason: "curriculum-not-required" },
        safetyMode: "readonly-safe-product-curriculum-generator"
      };
    }

    const features = productPlan.blueprint.mvp.features;
    return {
      curriculumId: `product_curriculum_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      generated: true,
      pedagogicalObjectives: [
        "build durable recall through retrieval practice",
        "increase fluency through short repeated sessions",
        "progress only after mastery evidence",
        "adapt difficulty from learner performance"
      ],
      levels: [
        { level: "foundation", goal: "understand core concepts and vocabulary", masteryThreshold: "80%" },
        { level: "practice", goal: "apply skills with guided feedback", masteryThreshold: "85%" },
        { level: "fluency", goal: "perform with less scaffolding and mixed practice", masteryThreshold: "90%" }
      ],
      modules: features.map((feature, index) => ({
        moduleId: `module_${index + 1}`,
        title: feature,
        progression: ["diagnostic", "guided practice", "active recall", "mixed review", "mastery check"],
        assessment: "short quiz, performance task and retry loop",
        methods: EDUCATION_METHODS
      })),
      progression: "foundation -> practice -> fluency with spaced review between modules",
      assessment: {
        diagnostic: true,
        formative: true,
        masteryBasedUnlocks: true,
        retryPolicy: "retry after feedback and spaced review"
      },
      gamification: ["streaks", "missions", "badges", "level unlocks"],
      adaptiveLearning: {
        signals: ["accuracy", "response confidence", "time on task", "review performance"],
        actions: ["increase practice", "reduce difficulty", "unlock next level", "schedule review"]
      },
      readonly: true,
      safetyMode: "readonly-safe-product-curriculum-generator"
    };
  }
}

module.exports = {
  ProductCurriculumGenerator,
  EDUCATION_METHODS
};
