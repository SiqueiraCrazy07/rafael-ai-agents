const AGENTS = {
  product: "Product Strategist Agent",
  pedagogy: "Pedagogy Agent",
  curriculum: "Curriculum Agent",
  game: "Game Design Agent",
  ux: "UX Agent",
  frontend: "Frontend Agent",
  backend: "Backend Agent",
  qa: "QA Agent",
  deployment: "Deployment Agent"
};

class ProductAgentOrchestrator {
  selectAgents({ classification, blueprint, architecture }) {
    const selected = [
      this.agent(AGENTS.product, "define product strategy, scope and MVP"),
      this.agent(AGENTS.ux, "design user journeys, screens and content states"),
      this.agent(AGENTS.frontend, "plan responsive frontend prototype"),
      this.agent(AGENTS.backend, "plan APIs, data entities and integration boundaries"),
      this.agent(AGENTS.qa, "validate consistency, scope and readiness"),
      this.agent(AGENTS.deployment, "prepare Docker/cloud-native metadata without real deploy")
    ];

    if (classification.categories.includes("education")) {
      selected.splice(1, 0,
        this.agent(AGENTS.pedagogy, "apply evidence-informed learning design"),
        this.agent(AGENTS.curriculum, "structure lessons, skill map and mastery sequence")
      );
    }
    if (classification.categories.includes("game")) {
      selected.splice(1, 0, this.agent(AGENTS.game, "design game loop, missions and feedback"));
    }

    return {
      orchestrationId: `product_agent_orchestration_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      selectedAgents: selected,
      handoffPlan: selected.map((item, index) => ({
        order: index + 1,
        agent: item.agent,
        input: index === 0 ? "parsed request and template" : "previous agent output",
        output: item.responsibility
      })),
      evidence: {
        categories: classification.categories,
        blueprintId: blueprint.blueprintId,
        architectureId: architecture.architectureId
      },
      readonly: true,
      executeAgents: false,
      safetyMode: "readonly-safe-product-agent-orchestrator"
    };
  }

  agent(agent, responsibility) {
    return {
      agent,
      responsibility,
      executionMode: "plan-only",
      readonly: true
    };
  }
}

module.exports = {
  ProductAgentOrchestrator,
  AGENTS
};
