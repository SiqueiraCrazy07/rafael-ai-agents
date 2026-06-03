class ProductBacklogGenerator {
  generate({ productPlan, ux, curriculum, assets }) {
    const blueprint = productPlan.blueprint;
    const epics = [
      {
        epic: "Product Foundation",
        priority: 1,
        features: ["project shell", "navigation", "role model", "JSON fallback"]
      },
      {
        epic: "Core MVP",
        priority: 2,
        features: blueprint.mvp.features
      },
      {
        epic: "UX Prototype",
        priority: 3,
        features: ux.screens.slice(0, 5)
      },
      {
        epic: "Observability",
        priority: 4,
        features: ["dashboard summary", "analytics events", "readiness report"]
      }
    ];
    if (curriculum.generated) {
      epics.splice(2, 0, {
        epic: "Learning System",
        priority: 3,
        features: ["curriculum levels", "mastery checks", "spaced review", "adaptive recommendations"]
      });
    }

    return {
      backlogId: `product_backlog_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      epics,
      features: epics.flatMap((epic) => epic.features.map((feature) => ({
        feature,
        epic: epic.epic,
        priority: epic.priority
      }))),
      tasks: epics.flatMap((epic) => epic.features.map((feature, index) => ({
        taskId: `${epic.epic.toLowerCase().replace(/[^a-z0-9]+/g, "-")}_${index + 1}`,
        title: `Define ${feature}`,
        priority: epic.priority,
        acceptanceCriteria: ["documented", "readonly-safe", "validated by readiness checks"]
      }))),
      assetTasks: assets.images.concat(assets.illustrations, assets.icons).map((asset) => ({
        title: `Plan asset: ${asset}`,
        priority: 5
      })),
      readonly: true,
      safetyMode: "readonly-safe-product-backlog-generator"
    };
  }
}

module.exports = {
  ProductBacklogGenerator
};
