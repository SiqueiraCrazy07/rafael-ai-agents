class ProductArchitectureGenerator {
  generate({ blueprint, classification }) {
    const realtimeNeeded = classification.categories.some((category) => ["scheduling", "crm", "game"].includes(category));
    const analyticsNeeded = classification.categories.some((category) => ["education", "business", "crm", "marketplace"].includes(category));

    return {
      architectureId: `product_architecture_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      frontend: {
        appType: "responsive web app",
        views: blueprint.ux.screens,
        state: "local state plus API-backed readonly demo data",
        accessibility: ["keyboard navigation", "semantic structure", "contrast checks"]
      },
      backend: {
        style: "modular API layer",
        services: ["product workspace", "users and roles", "workflow engine", "reporting"],
        readonlySafe: true
      },
      database: {
        primary: "PostgreSQL-ready relational schema",
        demoFallback: "JSON files in runtime-data and memory",
        entities: this.entitiesFor(classification.categories)
      },
      integrations: this.integrationsFor(classification.categories),
      apis: [
        "GET /product/blueprint",
        "GET /product/roadmap",
        "GET /product/analytics",
        "GET /product/templates"
      ],
      dashboards: ["operator dashboard", "admin dashboard", analyticsNeeded ? "analytics dashboard" : "status dashboard"],
      analytics: {
        enabled: analyticsNeeded,
        events: ["activation", "task completion", "dropoff", "retention", "quality signal"]
      },
      realtime: {
        needed: realtimeNeeded,
        transport: realtimeNeeded ? "websocket-ready metadata" : "polling or static snapshots"
      },
      deployment: {
        dockerReady: true,
        kubernetesDeployment: false,
        humanGateRequired: true
      },
      readonly: true,
      destructiveActions: false,
      safetyMode: "readonly-safe-product-architecture"
    };
  }

  entitiesFor(categories) {
    const entities = ["workspace", "user", "role", "audit_event", "dashboard_snapshot"];
    if (categories.includes("education")) entities.push("lesson", "skill", "assessment", "practice_result", "mastery_state");
    if (categories.includes("crm")) entities.push("contact", "deal", "activity", "pipeline_stage");
    if (categories.includes("scheduling")) entities.push("service", "availability", "appointment", "reminder");
    if (categories.includes("healthcare")) entities.push("patient", "provider", "visit_note");
    if (categories.includes("marketplace")) entities.push("lead", "campaign", "source");
    return [...new Set(entities)];
  }

  integrationsFor(categories) {
    const integrations = ["Runtime Gateway", "Telemetry", "Dashboard", "Streaming snapshots"];
    if (categories.includes("scheduling")) integrations.push("calendar provider metadata", "notification provider metadata");
    if (categories.includes("education")) integrations.push("content import pipeline", "learning analytics");
    if (categories.includes("crm")) integrations.push("email sync metadata", "lead capture forms");
    if (categories.includes("healthcare")) integrations.push("clinic scheduling metadata");
    return integrations;
  }
}

module.exports = {
  ProductArchitectureGenerator
};
