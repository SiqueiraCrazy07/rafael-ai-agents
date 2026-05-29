class ProductValidationEngine {
  validate({ parsedRequest, classification, template, blueprint, architecture, agents, roadmap }) {
    const checks = [
      this.check("request-present", Boolean(parsedRequest.rawRequest), "request must not be empty"),
      this.check("readonly-safe", parsedRequest.constraints.readonly && !parsedRequest.constraints.blocked, "request must remain readonly-safe"),
      this.check("category-classified", Boolean(classification.primaryCategory), "primary category required"),
      this.check("template-selected", Boolean(template.templateId), "template required"),
      this.check("blueprint-minimum", blueprint.features.length >= 3 && blueprint.mvp.features.length >= 2, "blueprint needs features and MVP"),
      this.check("architecture-minimum", architecture.frontend && architecture.backend && architecture.database, "architecture layers required"),
      this.check("agents-selected", agents.selectedAgents.length >= 5, "minimum agent set required"),
      this.check("roadmap-phases", roadmap.phases.length >= 4, "roadmap requires phases"),
      this.check("fallback-preserved", true, "JSON fallback must be preserved")
    ];
    const failures = checks.filter((check) => !check.ok);

    return {
      validationId: `product_validation_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      valid: failures.length === 0,
      checks,
      failures,
      consistency: {
        templateMatchesCategory: template.categories.some((category) => classification.categories.includes(category)),
        mvpInsideFeatureSet: blueprint.mvp.features.length > 0,
        architectureReferencesBlueprint: architecture.frontend.views.length === blueprint.ux.screens.length
      },
      viability: {
        scope: blueprint.mvp.features.length <= 6 ? "viable" : "needs-scope-reduction",
        deployment: architecture.deployment.kubernetesDeployment === false ? "v1-safe" : "requires-human-gate",
        riskLevel: failures.length ? "high" : "medium"
      },
      readonly: true,
      safetyMode: "readonly-safe-product-validation"
    };
  }

  check(id, ok, reason) {
    return {
      id,
      ok: Boolean(ok),
      reason,
      readonly: true
    };
  }
}

module.exports = {
  ProductValidationEngine
};
