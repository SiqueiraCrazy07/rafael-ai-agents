const path = require("node:path");

const SAFE_VALIDATION_SCRIPTS = Object.freeze([
  "governance:validate",
  "workers:scheduler-demo",
  "telemetry:demo",
  "dashboard:web-demo",
  "validate",
  "normalize"
]);

const BLOCKED_PATTERNS = Object.freeze([
  "rm ",
  "del ",
  "rmdir ",
  "Remove-Item",
  "git reset",
  "git checkout",
  "npm publish",
  "curl ",
  "Invoke-WebRequest",
  "wget ",
  "ssh ",
  "scp "
]);

class AutonomousGovernanceEnforcer {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.blockedProject = "PromoClub007";
  }

  evaluateObjective(objective = "") {
    const violations = [];
    const normalized = String(objective).toLowerCase();
    if (normalized.includes("delete") || normalized.includes("destrut")) {
      violations.push({
        rule: "destructive-objective-blocked",
        reason: "objective suggests destructive action"
      });
    }

    return {
      allowed: violations.length === 0,
      risk: violations.length > 0 ? "high" : "medium",
      violations,
      fallback: violations.length > 0 ? {
        safeMode: true,
        reason: "objective-requires-human-gate"
      } : null
    };
  }

  evaluateTask(task = {}) {
    const violations = [];
    const target = `${task.title || ""} ${task.description || ""} ${task.path || ""}`;
    if (target.includes(this.blockedProject)) {
      violations.push({
        rule: "project-isolation",
        reason: "PromoClub007 changes are blocked"
      });
    }
    if (task.destructiveActions === true) {
      violations.push({
        rule: "destructive-actions",
        reason: "destructive actions are blocked"
      });
    }
    if (task.externalExecution === true) {
      violations.push({
        rule: "external-execution",
        reason: "external execution is blocked in V1"
      });
    }
    if (task.secretsAccess === true) {
      violations.push({
        rule: "secrets-access",
        reason: "direct secrets access is blocked"
      });
    }
    if (task.altersAutomations === true) {
      violations.push({
        rule: "current-automation-change",
        reason: "changes to current automations are blocked"
      });
    }
    if (!task.fallback) {
      violations.push({
        rule: "fallback-required",
        reason: "every autonomous task must declare fallback"
      });
    }

    return {
      taskId: task.taskId,
      allowed: violations.length === 0,
      risk: violations.length > 0 ? "high" : task.risk || "medium",
      violations,
      safetyMode: "readonly-safe-autonomous-governance"
    };
  }

  evaluateCommand(scriptName) {
    const command = `npm run ${scriptName}`;
    const violations = [];
    if (!SAFE_VALIDATION_SCRIPTS.includes(scriptName)) {
      violations.push({
        rule: "command-not-allowlisted",
        reason: `${scriptName} is not in the autonomous validation allowlist`
      });
    }
    for (const pattern of BLOCKED_PATTERNS) {
      if (command.includes(pattern)) {
        violations.push({
          rule: "dangerous-command-pattern",
          reason: `blocked pattern detected: ${pattern}`
        });
      }
    }

    return {
      scriptName,
      command,
      allowed: violations.length === 0,
      violations,
      cwd: path.resolve(this.rootDir),
      safetyMode: "readonly-safe-command-validation"
    };
  }
}

module.exports = {
  AutonomousGovernanceEnforcer,
  SAFE_VALIDATION_SCRIPTS
};
