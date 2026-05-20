const { AutonomousOrchestrator } = require("../autonomous-orchestrator");

async function main() {
  const mode = process.argv.includes("--plan-only") ? "plan-only" : "run";
  const objective = "continuar evolução da plataforma";
  const orchestrator = new AutonomousOrchestrator();
  const report = mode === "plan-only"
    ? orchestrator.plan(objective)
    : await orchestrator.run(objective);

  const output = {
    executionId: report.executionId,
    correlationId: report.correlationId,
    mode: report.mode,
    objective: report.objective,
    readiness: report.readiness,
    plan: {
      planId: report.plan.planId,
      risk: report.plan.risk,
      nextStep: report.plan.nextStep,
      stopCriteria: report.plan.stopCriteria,
      humanGate: report.plan.humanGate,
      subtasks: report.plan.subtasks.map((task) => ({
        taskId: task.taskId,
        order: task.order,
        title: task.title,
        risk: task.risk,
        validations: task.validations,
        governanceAllowed: task.governance.allowed
      }))
    },
    tasks: report.tasks ? report.tasks.map((task) => ({
      jobId: task.jobId,
      workflowId: task.workflowId,
      dispatchStatus: task.dispatchStatus,
      validations: task.validations,
      sandboxRequired: task.sandboxRequired
    })) : [],
    validations: report.validations ? report.validations.validations.map((validation) => ({
      scriptName: validation.scriptName,
      status: validation.status,
      exitCode: validation.exitCode,
      durationMs: validation.durationMs,
      fallback: validation.fallback
    })) : [],
    recovery: report.recovery ? {
      status: report.recovery.status,
      humanGate: report.recovery.humanGate,
      actions: report.recovery.recoveryActions
    } : null,
    progress: {
      currentStep: report.progress.currentStep,
      blockers: report.progress.blockers,
      retries: report.progress.retries,
      nextStep: report.progress.nextStep
    },
    fallback: report.fallback,
    persistence: report.persistence
  };

  console.log(JSON.stringify(output, null, 2));

  if (report.readiness === "attention_required") {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(JSON.stringify({
      status: "failed",
      error: error.message,
      fallback: {
        safeMode: true,
        reason: "autonomous-orchestrator-demo-error"
      }
    }, null, 2));
    process.exitCode = 1;
  });
}
