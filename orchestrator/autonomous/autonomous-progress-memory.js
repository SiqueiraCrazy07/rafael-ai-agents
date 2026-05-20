const fs = require("node:fs");
const path = require("node:path");

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

class AutonomousProgressMemory {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
  }

  buildProgress({ objective, plan, dispatchReport, validationReport, recoveryReport }) {
    const failedValidations = validationReport ? validationReport.failures : [];
    return {
      progressId: `autonomous_progress_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      objective,
      currentStep: this.currentStep(validationReport, recoveryReport),
      roadmap: plan.subtasks.map((task) => ({
        taskId: task.taskId,
        order: task.order,
        title: task.title,
        risk: task.risk,
        validations: task.validations
      })),
      subtasks: dispatchReport ? dispatchReport.jobs : [],
      results: validationReport ? validationReport.validations : [],
      blockers: [
        ...(plan.blockers || []),
        ...failedValidations.map((failure) => ({
          scriptName: failure.scriptName,
          status: failure.status,
          reason: failure.fallback?.reason || "validation-failed"
        }))
      ],
      retries: recoveryReport ? recoveryReport.recoveryActions.filter((action) => action.action === "safe-retry-available") : [],
      nextStep: this.nextStep(plan, validationReport, recoveryReport),
      fallback: {
        safeMode: true,
        behavior: "progress memory is append-only and does not execute actions"
      }
    };
  }

  currentStep(validationReport, recoveryReport) {
    if (!validationReport) {
      return "planned";
    }
    if (validationReport.status !== "validations_passed") {
      return "recovery-required";
    }
    if (recoveryReport?.humanGate?.required) {
      return "human-gate";
    }
    return "validated";
  }

  nextStep(plan, validationReport, recoveryReport) {
    if (recoveryReport?.humanGate?.required) {
      return "wait-for-human-gate";
    }
    if (!validationReport) {
      return plan.nextStep;
    }
    if (validationReport.status !== "validations_passed") {
      return "apply-safe-retry-or-human-gate";
    }
    return "continue-platform-evolution-with-next-readonly-module";
  }

  persist(progress) {
    const runtimeDir = path.join(this.rootDir, "runtime-data", "autonomous-orchestrator");
    const memoryDir = path.join(this.rootDir, "memory", "autonomous-orchestrator");
    ensureDir(runtimeDir);
    ensureDir(memoryDir);
    const filename = `autonomous-progress-${timestampForFile()}.json`;
    const runtimePath = path.join(runtimeDir, filename);
    const memoryPath = path.join(memoryDir, filename);
    fs.writeFileSync(runtimePath, `${JSON.stringify(progress, null, 2)}\n`, "utf8");
    fs.writeFileSync(memoryPath, `${JSON.stringify(progress, null, 2)}\n`, "utf8");
    return { runtimePath, memoryPath };
  }
}

module.exports = {
  AutonomousProgressMemory
};
