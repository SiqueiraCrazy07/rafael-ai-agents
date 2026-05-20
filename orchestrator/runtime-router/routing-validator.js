class RoutingValidator {
  validateDecision(decision) {
    const errors = [];

    if (!decision.decisionId) errors.push("decisionId is required");
    if (!decision.status) errors.push("status is required");
    if (decision.status === "routed" && !decision.selectedAgent) {
      errors.push("selectedAgent is required for routed decisions");
    }
    if (!Array.isArray(decision.candidates)) {
      errors.push("candidates must be an array");
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = {
  RoutingValidator
};
