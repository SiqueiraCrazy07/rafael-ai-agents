const { RuntimeEngine } = require("./runtime-engine");
const { STATES } = require("../state/state-machine");

async function runDemo() {
  const engine = new RuntimeEngine();

  const execution = await engine.startExecution({
    workflow: "runtime-v1-demo",
    project: "promoclub007",
    agents: ["site-backend-agent", "site-qa-agent"],
    retries: { count: 0, max: 2 },
    risks: [
      {
        level: "low",
        description: "Demo execution only. No production side effects.",
        mitigation: "Uses local runtime-data storage."
      }
    ],
    metadata: {
      source: "engine/runtime/demo-runtime-flow.js"
    }
  });

  await engine.transition(execution, STATES.ROUTED, { router: "demo-router" });
  await engine.transition(execution, STATES.RUNNING, { step: "start-demo-workflow" });

  const firstCheckpoint = await engine.createCheckpoint(execution, {
    summary: "Initial running state captured before simulated retry.",
    artifacts: ["runtime-data/executions"],
    data: { step: "before-retry" }
  });

  await engine.transition(execution, STATES.FAILED, {
    reason: "simulated transient failure"
  });
  await engine.startRetry(execution, "simulated retry after transient failure");
  await engine.transition(execution, STATES.RUNNING, { step: "retry-resumed" });

  const secondCheckpoint = await engine.createCheckpoint(execution, {
    summary: "Recovery checkpoint captured after retry.",
    artifacts: ["runtime-data/checkpoints"],
    data: { recoveredFrom: firstCheckpoint.checkpointId }
  });

  await engine.transition(execution, STATES.VALIDATED, {
    checkpointId: secondCheckpoint.checkpointId
  });

  const completed = await engine.completeExecution(execution, [
    {
      name: "demo-runtime-output",
      type: "json",
      path: `runtime-data/executions/${execution.executionId}.json`,
      summary: "Demo execution object persisted locally."
    }
  ]);

  const rollbackExecution = await engine.startExecution({
    workflow: "runtime-v1-rollback-demo",
    project: "promoclub007",
    agents: ["site-backend-agent", "site-qa-agent"],
    retries: { count: 0, max: 1 },
    risks: [
      {
        level: "medium",
        description: "Rollback path demonstration.",
        mitigation: "No external side effects."
      }
    ]
  });

  await engine.transition(rollbackExecution, STATES.ROUTED, { router: "demo-router" });
  await engine.transition(rollbackExecution, STATES.RUNNING, { step: "start-rollback-demo" });
  await engine.createCheckpoint(rollbackExecution, {
    summary: "Checkpoint before simulated rollback.",
    artifacts: ["runtime-data/checkpoints"],
    data: { step: "before-rollback" }
  });
  await engine.transition(rollbackExecution, STATES.FAILED, {
    reason: "simulated failure requiring rollback"
  });
  const rolledBack = await engine.rollback(
    rollbackExecution,
    "simulated rollback after failed execution"
  );

  const summary = {
    completedExecution: {
      executionId: completed.execution.executionId,
      status: completed.execution.status,
      checkpoints: completed.execution.checkpoints.length,
      retries: completed.execution.retries.count,
      telemetry: completed.telemetry
    },
    rollbackExecution: {
      executionId: rolledBack.execution.executionId,
      status: rolledBack.execution.status,
      checkpoints: rolledBack.execution.checkpoints.length,
      retries: rolledBack.execution.retries.count,
      telemetry: rolledBack.telemetry
    }
  };

  console.log(JSON.stringify(summary, null, 2));
}

runDemo().catch((error) => {
  console.error(`Runtime demo failed: ${error.message}`);
  process.exitCode = 1;
});
