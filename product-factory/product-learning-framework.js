const LEARNING_METHODS = [
  "active recall",
  "spaced repetition",
  "interleaving",
  "scaffolding",
  "microlearning",
  "gamification",
  "adaptive learning",
  "mastery learning",
  "deliberate practice"
];

class ProductLearningFramework {
  apply({ classification, template }) {
    const applies = classification.categories.includes("education") || classification.categories.includes("game");
    if (!applies) {
      return {
        applied: false,
        methods: [],
        productLearningPlan: [],
        fallback: { safeMode: true, reason: "non-education-product" },
        readonly: true,
        safetyMode: "readonly-safe-product-learning-framework"
      };
    }

    return {
      applied: true,
      methods: LEARNING_METHODS,
      productLearningPlan: [
        "map each feature to a measurable learning objective",
        "use active recall in quizzes and review prompts",
        "schedule spaced repetition for weak skills",
        "mix topics through interleaving after each lesson block",
        "scaffold complex skills into guided practice before free practice",
        "deliver microlearning sessions under 10 minutes",
        "add points, streaks and missions without hiding learning goals",
        "adapt difficulty from performance signals",
        "require mastery thresholds before unlocking advanced modules",
        "include deliberate practice loops with feedback and retry"
      ],
      templateId: template.templateId,
      readonly: true,
      safetyMode: "readonly-safe-product-learning-framework"
    };
  }
}

module.exports = {
  ProductLearningFramework,
  LEARNING_METHODS
};
