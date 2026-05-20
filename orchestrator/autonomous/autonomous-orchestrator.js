const { AutonomousExecutionPlanner } = require("./autonomous-execution-planner");
const { AutonomousTaskDispatcher } = require("./autonomous-task-dispatcher");
const { AutonomousValidator } = require("./autonomous-validator");
const { AutonomousRecoveryEngine } = require("./autonomous-recovery-engine");
const { AutonomousProgressMemory } = require("./autonomous-progress-memory");
const { AutonomousGovernanceEnforcer, SAFE_VALIDATION_SCRIPTS } = require("./autonomous-governance-enforcer");
const { AutonomousExecutionAudit } = require("./autonomous-execution-audit");

function stableId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

class AutonomousOrchestrator {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.governance = options.governance || new AutonomousGovernanceEnforcer(options);
    this.planner = options.planner || new AutonomousExecutionPlanner({ ...options, governance: this.governance });
    this.dispatcher = options.dispatcher || new AutonomousTaskDispatcher(options);
    this.validator = options.validator || new AutonomousValidator({ ...options, governance: this.governance });
    this.recovery = options.recovery || new AutonomousRecoveryEngine(options);
    this.progressMemory = options.progressMemory || new AutonomousProgressMemory(options);
    this.audit = options.audit || new AutonomousExecutionAudit(options);
  }

  plan(objective = "continuar evolução da plataforma") {
    const executionId = stableId("autonomous_execution_plan");
    const correlationId = stableId("autonomous_correlation");
    const plan = this.planner.createPlan(objective);
    const progress = this.progressMemory.buildProgress({
      objective,
      plan,
      dispatchReport: null,
      validationReport: null,
      recoveryReport: null
    });
    const progressPersistence = this.progressMemory.persist(progress);
    const report = {
      executionId,
      correlationId,
      objective,
      generatedAt: new Date().toISOString(),
      mode: "plan-only",
      readonly: true,
      destructiveActions: false,
      plan,
      progress,
      readiness: plan.humanGate.required ? "human_gate_required" : "autonomous_plan_ready",
      fallback: {
        safeMode: true,
        behavior: "plan-only mode does not dispatch or execute validations"
      },
      persistence: {
        progress: progressPersistence
      }
    };
    report.persistence.audit = this.audit.persist(report);
    return report;
  }

  async run(objective = "continuar evolução da plataforma") {
    const executionId = stableId("autonomous_execution");
    const correlationId = stableId("autonomous_correlation");
    const plan = this.planner.createPlan(objective);
    const dispatchReport = this.dispatcher.dispatch(plan);
    const validationReport = this.validator.validate(SAFE_VALIDATION_SCRIPTS);
    const recoveryReport = this.recovery.recover({ plan, validationReport, dispatchReport });
    const progress = this.progressMemory.buildProgress({
      objective,
      plan,
      dispatchReport,
      validationReport,
      recoveryReport
    });
    const progressPersistence = this.progressMemory.persist(progress);
    const readiness = validationReport.status === "validations_passed" && !recoveryReport.humanGate.required
      ? "autonomous_orchestrator_ready"
      : recoveryReport.humanGate.required
        ? "human_gate_required"
        : "attention_required";

    const report = {
      executionId,
      correlationId,
      objective,
      generatedAt: new Date().toISOString(),
      mode: "supervised-autonomous-demo",
      readonly: true,
      destructiveActions: false,
      governance: {
        blockedActions: [
          "destructive-actions",
          "PromoClub007-changes",
          "external-execution",
          "secret-access",
          "current-automation-changes",
          "tasks-without-fallback"
        ],
        validationAllowlist: SAFE_VALIDATION_SCRIPTS
      },
      plan,
      tasks: dispatchReport.jobs,
      dispatch: dispatchReport,
      validations: validationReport,
      recovery: recoveryReport,
      progress,
      readiness,
      nextStep: progress.nextStep,
      humanGate: recoveryReport.humanGate,
      fallback: {
        safeMode: true,
        behavior: "autonomous layer is supervised and readonly; failures are routed to recovery or human gate"
      },
      persistence: {
        progress: progressPersistence
      }
    };
    report.persistence.audit = this.audit.persist(report);
    return report;
  }
}

module.exports = {
  AutonomousOrchestrator
};
