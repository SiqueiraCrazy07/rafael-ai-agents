const { AutonomousGovernanceEnforcer } = require("./autonomous-governance-enforcer");

class AutonomousExecutionPlanner {
  constructor(options = {}) {
    this.governance = options.governance || new AutonomousGovernanceEnforcer(options);
  }

  createPlan(objective = "continuar evolução da plataforma") {
    const objectiveEvaluation = this.governance.evaluateObjective(objective);
    const planId = `autonomous_plan_${Date.now()}`;
    const subtasks = [
      {
        taskId: "autonomous-task-readiness-scan",
        title: "Scan governance and runtime readiness",
        description: "Validate governance, worker scheduler, telemetry, dashboard and platform validators.",
        risk: "medium",
        destructiveActions: false,
        externalExecution: false,
        secretsAccess: false,
        altersAutomations: false,
        fallback: {
          safeMode: true,
          behavior: "stop and persist blocker if validation fails"
        },
        validations: ["governance:validate"]
      },
      {
        taskId: "autonomous-task-scheduler-plan",
        title: "Create worker execution plan",
        description: "Use Worker Scheduler + Execution Planner to create readonly execution plan.",
        risk: "medium",
        destructiveActions: false,
        externalExecution: false,
        secretsAccess: false,
        altersAutomations: false,
        fallback: {
          safeMode: true,
          behavior: "protected queue and human gate when no safe route exists"
        },
        validations: ["workers:scheduler-demo"]
      },
      {
        taskId: "autonomous-task-observability-check",
        title: "Validate observability and dashboard readiness",
        description: "Run telemetry and dashboard readonly demos.",
        risk: "medium",
        destructiveActions: false,
        externalExecution: false,
        secretsAccess: false,
        altersAutomations: false,
        fallback: {
          safeMode: true,
          behavior: "keep runtime readonly and flag dashboard/telemetry gaps"
        },
        validations: ["telemetry:demo", "dashboard:web-demo"]
      },
      {
        taskId: "autonomous-task-platform-validation",
        title: "Validate platform normalization and offer validation",
        description: "Run existing safe validation and normalization scripts without changing automations.",
        risk: "low",
        destructiveActions: false,
        externalExecution: false,
        secretsAccess: false,
        altersAutomations: false,
        fallback: {
          safeMode: true,
          behavior: "record validation blocker and stop automatic continuation"
        },
        validations: ["validate", "normalize"]
      }
    ];

    const governedSubtasks = subtasks.map((task, index) => ({
      ...task,
      order: index + 1,
      governance: this.governance.evaluateTask(task)
    }));
    const blockers = governedSubtasks
      .filter((task) => !task.governance.allowed)
      .map((task) => ({
        taskId: task.taskId,
        violations: task.governance.violations
      }));

    return {
      planId,
      generatedAt: new Date().toISOString(),
      objective,
      readonly: true,
      destructiveActions: false,
      safetyMode: "readonly-safe-autonomous-planning",
      objectiveEvaluation,
      risk: blockers.length > 0 || objectiveEvaluation.risk === "high" ? "high" : "medium",
      stopCriteria: [
        "governance violation detected",
        "validation command fails after allowed recovery attempt",
        "risk classified as high",
        "human gate required"
      ],
      nextStep: "dispatch-governed-subtasks",
      subtasks: governedSubtasks,
      blockers,
      humanGate: blockers.length > 0 || objectiveEvaluation.risk === "high" ? {
        required: true,
        reason: "plan contains governance blockers or high objective risk"
      } : {
        required: false,
        reason: "plan remains readonly-safe with explicit fallback"
      },
      fallback: {
        safeMode: true,
        behavior: "if any task becomes unsafe, stop dispatch and persist progress"
      }
    };
  }
}

module.exports = {
  AutonomousExecutionPlanner
};
