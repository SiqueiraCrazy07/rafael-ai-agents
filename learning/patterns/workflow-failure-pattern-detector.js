class WorkflowFailurePatternDetector {
  detect(memory) {
    const failures = [];

    for (const item of memory.workflowReports) {
      const workflows = item.data.workflows || [];
      for (const workflow of workflows) {
        if (workflow.status === "unstable" || workflow.rolledBack > 0 || workflow.failed > 0) {
          failures.push({
            workflow: workflow.workflow,
            project: workflow.project,
            failed: workflow.failed,
            rolledBack: workflow.rolledBack,
            retries: workflow.retries,
            stabilityScore: workflow.stabilityScore,
            status: workflow.status
          });
        }
      }
    }

    return failures;
  }
}

module.exports = {
  WorkflowFailurePatternDetector
};
