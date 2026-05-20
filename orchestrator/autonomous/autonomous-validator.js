const { spawnSync } = require("node:child_process");
const { AutonomousGovernanceEnforcer, SAFE_VALIDATION_SCRIPTS } = require("./autonomous-governance-enforcer");

class AutonomousValidator {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.timeoutMs = options.timeoutMs || 120000;
    this.governance = options.governance || new AutonomousGovernanceEnforcer(options);
  }

  validate(scriptNames = SAFE_VALIDATION_SCRIPTS) {
    const validations = [];

    for (const scriptName of scriptNames) {
      const commandGovernance = this.governance.evaluateCommand(scriptName);
      if (!commandGovernance.allowed) {
        validations.push({
          scriptName,
          command: commandGovernance.command,
          status: "blocked",
          exitCode: null,
          durationMs: 0,
          stdoutPreview: "",
          stderrPreview: "",
          governance: commandGovernance,
          fallback: {
            safeMode: true,
            reason: "command-blocked-by-governance"
          }
        });
        continue;
      }

      const started = Date.now();
      const result = spawnSync("npm", ["run", scriptName], {
        cwd: this.rootDir,
        shell: true,
        encoding: "utf8",
        timeout: this.timeoutMs,
        maxBuffer: 1024 * 1024 * 8
      });
      const durationMs = Date.now() - started;
      const timedOut = result.error && result.error.code === "ETIMEDOUT";
      const exitCode = typeof result.status === "number" ? result.status : timedOut ? 124 : 1;

      validations.push({
        scriptName,
        command: commandGovernance.command,
        status: exitCode === 0 ? "passed" : timedOut ? "timeout" : "failed",
        exitCode,
        durationMs,
        stdoutPreview: this.preview(result.stdout),
        stderrPreview: this.preview(result.stderr || result.error?.message || ""),
        governance: commandGovernance,
        fallback: exitCode === 0 ? null : {
          safeMode: true,
          reason: timedOut ? "validation-timeout" : "validation-failed"
        }
      });
    }

    return {
      validationReportId: `autonomous_validation_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      readonly: true,
      destructiveActions: false,
      validations,
      status: validations.every((validation) => validation.status === "passed")
        ? "validations_passed"
        : "validations_attention_required",
      failures: validations.filter((validation) => validation.status !== "passed"),
      fallback: {
        safeMode: true,
        behavior: "failed validations are reported to recovery engine; no destructive correction is attempted"
      }
    };
  }

  preview(value) {
    return String(value || "").trim().slice(0, 2000);
  }
}

module.exports = {
  AutonomousValidator
};
