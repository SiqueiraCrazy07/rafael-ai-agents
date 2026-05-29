class ProductRoadmapGenerator {
  generate({ blueprint, architecture, classification }) {
    const phases = [
      {
        phase: "discovery",
        duration: "1 week",
        outcomes: ["validate persona", "confirm MVP scope", "define success metrics"]
      },
      {
        phase: "prototype",
        duration: "2 weeks",
        outcomes: ["clickable UX", "readonly API contracts", "demo data model"]
      },
      {
        phase: "mvp",
        duration: "4 weeks",
        outcomes: blueprint.mvp.features
      },
      {
        phase: "beta",
        duration: "3 weeks",
        outcomes: ["role-based dashboard", "analytics review", "QA hardening"]
      },
      {
        phase: "cloud-readiness",
        duration: "2 weeks",
        outcomes: ["Docker validation", "observability", "human-gated deployment plan"]
      }
    ];

    if (classification.categories.includes("education")) {
      phases.splice(2, 0, {
        phase: "learning-design",
        duration: "1 week",
        outcomes: ["learning objectives", "mastery criteria", "practice loops", "content rubric"]
      });
    }

    return {
      roadmapId: `product_roadmap_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      phases,
      dependencies: ["template selection", "validated requirements", "data model approval", "QA checklist"],
      milestones: phases.map((phase, index) => ({
        milestoneId: `milestone_${index + 1}`,
        name: phase.phase,
        doneWhen: phase.outcomes
      })),
      implementationPlan: [
        "create product workspace shell",
        "implement frontend flows from blueprint screens",
        "add readonly API routes and JSON fallback",
        "persist demo reports to runtime-data and memory",
        "connect telemetry and dashboard summaries",
        "run governance and validation demos"
      ],
      architectureId: architecture.architectureId,
      readonly: true,
      destructiveActions: false,
      safetyMode: "readonly-safe-product-roadmap"
    };
  }
}

module.exports = {
  ProductRoadmapGenerator
};
