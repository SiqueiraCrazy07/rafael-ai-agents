const { createSandboxContext } = require("./sandbox-context");
const { SandboxPolicy } = require("./sandbox-policy");

function timeoutResult(timeoutMs) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        timedOut: true,
        status: "timeout",
        error: `sandbox execution timed out after ${timeoutMs}ms`
      });
    }, timeoutMs);
  });
}

class SandboxRunner {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.policy = options.policy || new SandboxPolicy(options);
  }

  createApi(actions) {
    return {
      attempt: (action) => {
        const evaluation = this.policy.evaluateAction(action);
        if (evaluation.allowed) {
          actions.allowedActions.push(evaluation);
        } else {
          actions.deniedActions.push(evaluation);
        }
        return {
          allowed: evaluation.allowed,
          reason: evaluation.reason
        };
      },
      writeFile: (targetPath) => {
        const evaluation = this.policy.evaluateAction({
          type: "filesystem-write",
          path: targetPath
        });
        if (evaluation.allowed) {
          actions.allowedActions.push({
            ...evaluation,
            simulated: true,
            reason: `${evaluation.reason}; write simulated in readonly-safe mode`
          });
        } else {
          actions.deniedActions.push(evaluation);
        }
        return {
          allowed: evaluation.allowed,
          simulated: evaluation.allowed,
          reason: evaluation.reason
        };
      },
      networkCall: () => this.createApi(actions).attempt({ type: "network-call" }),
      externalCall: () => this.createApi(actions).attempt({ type: "external-call" }),
      accessSecret: () => this.createApi(actions).attempt({ type: "secret-access" })
    };
  }

  async run({ handler, request }) {
    const startedAt = new Date().toISOString();
    const policyEvaluation = this.policy.evaluateExecutionRequest(request);
    const actions = {
      allowedActions: [...policyEvaluation.allowedActions],
      deniedActions: [...policyEvaluation.deniedActions]
    };
    const context = createSandboxContext({
      ...request,
      policy: policyEvaluation.policy
    });

    if (!policyEvaluation.allowed) {
      return {
        status: "blocked",
        startedAt,
        completedAt: new Date().toISOString(),
        context,
        result: null,
        error: null,
        timedOut: false,
        allowedActions: actions.allowedActions,
        deniedActions: actions.deniedActions,
        policyViolations: actions.deniedActions,
        fallback: {
          safeMode: true,
          reason: "sandbox-policy-blocked-execution"
        }
      };
    }

    if (typeof handler !== "function") {
      actions.deniedActions.push({
        action: "handler-missing",
        reason: "sandbox handler must be a function"
      });
      return {
        status: "blocked",
        startedAt,
        completedAt: new Date().toISOString(),
        context,
        result: null,
        error: null,
        timedOut: false,
        allowedActions: actions.allowedActions,
        deniedActions: actions.deniedActions,
        policyViolations: actions.deniedActions,
        fallback: {
          safeMode: true,
          reason: "sandbox-handler-missing"
        }
      };
    }

    try {
      const api = this.createApi(actions);
      const execution = Promise.resolve().then(() => handler(context, api));
      const resolved = await Promise.race([
        execution.then((result) => ({ status: "completed", result })),
        timeoutResult(request.timeoutMs)
      ]);

      if (resolved.timedOut) {
        actions.deniedActions.push({
          action: "timeout",
          reason: resolved.error
        });
        return {
          status: "timeout",
          startedAt,
          completedAt: new Date().toISOString(),
          context,
          result: null,
          error: resolved.error,
          timedOut: true,
          allowedActions: actions.allowedActions,
          deniedActions: actions.deniedActions,
          policyViolations: actions.deniedActions,
          fallback: {
            safeMode: true,
            reason: "sandbox-timeout"
          }
        };
      }

      const destructiveOutput = resolved.result && resolved.result.destructiveActions === true;
      if (destructiveOutput) {
        actions.deniedActions.push({
          action: "destructive-output",
          reason: "handler returned destructiveActions=true"
        });
      }

      return {
        status: destructiveOutput || actions.deniedActions.length > policyEvaluation.deniedActions.length
          ? "policy-violation"
          : "completed",
        startedAt,
        completedAt: new Date().toISOString(),
        context,
        result: destructiveOutput ? null : resolved.result,
        error: null,
        timedOut: false,
        allowedActions: actions.allowedActions,
        deniedActions: actions.deniedActions,
        policyViolations: actions.deniedActions,
        fallback: destructiveOutput || actions.deniedActions.length > policyEvaluation.deniedActions.length
          ? {
              safeMode: true,
              reason: "sandbox-policy-violation-captured"
            }
          : null
      };
    } catch (error) {
      actions.deniedActions.push({
        action: "handler-error",
        reason: error.message
      });
      return {
        status: "failed",
        startedAt,
        completedAt: new Date().toISOString(),
        context,
        result: null,
        error: error.message,
        timedOut: false,
        allowedActions: actions.allowedActions,
        deniedActions: actions.deniedActions,
        policyViolations: actions.deniedActions,
        fallback: {
          safeMode: true,
          reason: "sandbox-handler-error"
        }
      };
    }
  }
}

module.exports = {
  SandboxRunner
};
