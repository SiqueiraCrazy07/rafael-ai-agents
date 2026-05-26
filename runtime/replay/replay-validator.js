class ReplayValidator {
  validate({ plan, journal, checkpoints, events }) {
    const errors = [];
    const warnings = [];

    if (!plan?.readonly) {
      errors.push("replay-plan-must-be-readonly");
    }
    if (plan?.reexecuteWorkflow) {
      errors.push("workflow-reexecution-is-blocked-in-v1");
    }
    if (plan?.destructiveActions) {
      errors.push("destructive-actions-are-blocked");
    }
    if (!plan?.filters?.workflowId && !plan?.filters?.executionId && !plan?.filters?.correlationId) {
      warnings.push("no-filter-provided-replay-uses-latest-available-execution");
    }
    if (!journal?.entries?.length) {
      warnings.push("no-journal-entries-found");
    }
    if (!checkpoints?.checkpoints?.length) {
      warnings.push("no-checkpoints-found");
    }
    if (!events?.events?.length) {
      warnings.push("no-events-found");
    }

    return {
      valid: errors.length === 0,
      readonlySafe: errors.length === 0,
      reexecutionBlocked: true,
      errors,
      warnings,
      safetyMode: "readonly-safe-workflow-replay"
    };
  }
}

module.exports = {
  ReplayValidator
};
