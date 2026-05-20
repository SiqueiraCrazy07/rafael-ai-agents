const { WorkerSandbox } = require("../sandbox/worker-sandbox");

async function runScenario(sandbox, scenario) {
  return sandbox.execute({
    executionId: scenario.executionId,
    correlationId: scenario.correlationId,
    workerId: scenario.workerId,
    workflowId: scenario.workflowId,
    project: "platform",
    allowedCapabilities: ["runtime-read", "telemetry-read"],
    readonly: scenario.readonly,
    destructiveActions: scenario.destructiveActions,
    timeoutMs: scenario.timeoutMs,
    payload: scenario.payload,
    handler: scenario.handler
  });
}

async function main() {
  const sandbox = new WorkerSandbox();
  const scenarios = [
    {
      name: "readonly-success",
      executionId: "sandbox-demo-execution-success",
      correlationId: "sandbox-demo-correlation-success",
      workerId: "worker-runtime-read-1",
      workflowId: "sandbox-demo-workflow-success",
      readonly: true,
      destructiveActions: false,
      timeoutMs: 500,
      payload: {
        type: "readonly"
      },
      handler: async (context, api) => {
        api.attempt({ type: "readonly-execution", workflowId: context.workflowId });
        api.writeFile("runtime-data/workers/sandbox-demo-simulated.json");
        return {
          status: "completed",
          readonly: true,
          destructiveActions: false
        };
      }
    },
    {
      name: "destructive-request-blocked",
      executionId: "sandbox-demo-execution-destructive",
      correlationId: "sandbox-demo-correlation-destructive",
      workerId: "worker-runtime-read-1",
      workflowId: "sandbox-demo-workflow-destructive",
      readonly: false,
      destructiveActions: true,
      timeoutMs: 500,
      payload: {
        type: "blocked"
      },
      handler: async () => ({
        status: "should-not-run"
      })
    },
    {
      name: "network-secret-filesystem-blocked",
      executionId: "sandbox-demo-execution-violations",
      correlationId: "sandbox-demo-correlation-violations",
      workerId: "worker-runtime-read-2",
      workflowId: "sandbox-demo-workflow-violations",
      readonly: true,
      destructiveActions: false,
      timeoutMs: 500,
      payload: {
        type: "violations"
      },
      handler: async (context, api) => {
        api.networkCall("https://example.com");
        api.accessSecret("API_KEY");
        api.writeFile("projects/PromoClub007/blocked-output.json");
        return {
          status: "completed",
          readonly: true,
          destructiveActions: false,
          contextWorkflow: context.workflowId
        };
      }
    },
    {
      name: "payload-too-large-blocked",
      executionId: "sandbox-demo-execution-payload",
      correlationId: "sandbox-demo-correlation-payload",
      workerId: "worker-runtime-read-1",
      workflowId: "sandbox-demo-workflow-payload",
      readonly: true,
      destructiveActions: false,
      timeoutMs: 500,
      payload: {
        text: "x".repeat(12000)
      },
      handler: async () => ({
        status: "should-not-run"
      })
    },
    {
      name: "timeout-blocked",
      executionId: "sandbox-demo-execution-timeout",
      correlationId: "sandbox-demo-correlation-timeout",
      workerId: "worker-runtime-read-2",
      workflowId: "sandbox-demo-workflow-timeout",
      readonly: true,
      destructiveActions: false,
      timeoutMs: 50,
      payload: {
        type: "timeout"
      },
      handler: async () => new Promise((resolve) => {
        setTimeout(() => resolve({
          status: "late-result",
          readonly: true,
          destructiveActions: false
        }), 200);
      })
    }
  ];

  const reports = [];
  for (const scenario of scenarios) {
    const report = await runScenario(sandbox, scenario);
    reports.push({
      scenario: scenario.name,
      sandboxReportId: report.sandboxReportId,
      status: report.status,
      executionId: report.context.executionId,
      correlationId: report.context.correlationId,
      workerId: report.context.workerId,
      workflowId: report.context.workflowId,
      allowedActions: report.allowedActions.map((action) => action.action),
      deniedActions: report.deniedActions.map((action) => action.action),
      policyViolations: report.policyViolations.length,
      timedOut: report.timeout.timedOut,
      fallback: report.fallback,
      persistence: report.persistence
    });
  }

  const summary = {
    demo: "workers:sandbox-demo",
    status: reports.some((report) => report.status === "completed") &&
      reports.some((report) => report.deniedActions.length > 0)
      ? "worker_sandbox_demo_passed"
      : "worker_sandbox_demo_attention",
    readonly: true,
    destructiveActions: false,
    policiesCreated: [
      "readonly-required",
      "destructive-actions-blocked",
      "filesystem-write-path-guard",
      "network-external-calls-blocked",
      "secret-access-blocked",
      "payload-size-limit",
      "mandatory-timeout"
    ],
    reports,
    blockedViolations: reports.reduce((total, report) => total + report.policyViolations, 0),
    integration: {
      workerRuntime: "workers/runtime-worker.js uses WorkerSandbox for job execution",
      pluginHooks: "sandbox context preserves readonly correlation for plugin hook inputs",
      connectors: "connector execution remains outside worker handler and readonly governed",
      telemetry: "memory/worker-sandbox is read by telemetry metrics collector"
    },
    fallback: {
      safeMode: true,
      behavior: "blocked or failed sandbox executions return safe reports and do not crash the runtime"
    }
  };

  console.log(JSON.stringify(summary, null, 2));

  if (summary.status !== "worker_sandbox_demo_passed") {
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
        reason: "worker-sandbox-demo-error"
      }
    }, null, 2));
    process.exitCode = 1;
  });
}
