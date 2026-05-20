const { SandboxAudit } = require("./sandbox-audit");
const { SandboxPolicy } = require("./sandbox-policy");
const { SandboxRunner } = require("./sandbox-runner");
const { stableId } = require("../worker-execution-context");

class WorkerSandbox {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.policy = options.policy || new SandboxPolicy(options);
    this.runner = options.runner || new SandboxRunner({
      ...options,
      policy: this.policy
    });
    this.audit = options.audit || new SandboxAudit(options);
  }

  async execute(input = {}) {
    const sandboxExecutionId = stableId(`worker_sandbox_${input.workflowId || "workflow"}`);
    const request = {
      executionId: input.executionId || sandboxExecutionId,
      correlationId: input.correlationId,
      workerId: input.workerId,
      workflowId: input.workflowId,
      project: input.project || "platform",
      allowedCapabilities: input.allowedCapabilities || [],
      readonly: input.readonly === true,
      destructiveActions: input.destructiveActions === true,
      payload: input.payload || {},
      timeoutMs: input.timeoutMs
    };
    const run = await this.runner.run({
      handler: input.handler,
      request
    });
    const report = {
      sandboxReportId: sandboxExecutionId,
      generatedAt: new Date().toISOString(),
      source: "worker-sandbox-v1",
      status: run.status,
      readonly: true,
      destructiveActions: false,
      context: run.context,
      allowedActions: run.allowedActions,
      deniedActions: run.deniedActions,
      timeout: {
        timeoutMs: request.timeoutMs || null,
        timedOut: run.timedOut
      },
      policyViolations: run.policyViolations,
      executionResult: run.result,
      error: run.error,
      fallback: run.fallback || {
        safeMode: true,
        reason: "sandbox-execution-completed"
      },
      persistence: null
    };
    report.persistence = this.audit.persist(report);
    return report;
  }
}

module.exports = {
  WorkerSandbox
};
