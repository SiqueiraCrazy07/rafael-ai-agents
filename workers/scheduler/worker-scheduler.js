const fs = require("node:fs");
const path = require("node:path");
const { ExecutionPlanner } = require("./execution-planner");

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

class WorkerScheduler {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.planner = options.planner || new ExecutionPlanner(options);
  }

  schedule() {
    const plan = this.planner.createPlan();
    const scheduledJobs = plan.executionPlans.map((item) => ({
      scheduleId: `schedule_${Date.now()}_${item.workflowId}`,
      workflowId: item.workflowId,
      jobId: item.jobId,
      action: item.action,
      selectedWorkerId: item.route.selectedWorkerId,
      scheduledAt: item.window.scheduledAt,
      expiresAt: item.window.expiresAt,
      windowType: item.window.type,
      priorityScore: item.priority.score,
      retryScheduled: item.retry.scheduled,
      protectedQueueRelease: item.protectedQueue.releaseAllowed,
      safetyMode: item.safetyMode,
      reason: item.reason
    }));

    const report = {
      workerSchedulerReportId: `worker_scheduler_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      source: "worker-scheduler-v1",
      status: scheduledJobs.length > 0 ? "worker_scheduler_plan_created" : "worker_scheduler_no_jobs",
      readonly: true,
      destructiveActions: false,
      scheduleStrategy: {
        executionWindows: true,
        delayedExecution: true,
        retryScheduling: true,
        protectedQueueRelease: true,
        lowSaturationRouting: true
      },
      plan,
      scheduledJobs,
      metrics: {
        totalScheduled: scheduledJobs.filter((job) => job.action === "schedule").length,
        totalProtected: scheduledJobs.filter((job) => job.action === "protected-queue").length,
        delayedExecutions: scheduledJobs.filter((job) => job.windowType === "delayed").length,
        retrySchedules: scheduledJobs.filter((job) => job.retryScheduled).length,
        protectedReleaseCandidates: scheduledJobs.filter((job) => job.windowType === "protected-release").length
      },
      fallback: {
        safeMode: true,
        behavior: "scheduler emits declarative plans only and does not execute workers",
        missingSources: plan.fallback.missingSources,
        protectedPlanItems: plan.fallback.protectedPlanItems
      },
      persistence: null
    };
    report.persistence = this.persist(report);
    return report;
  }

  persist(report) {
    const runtimeDir = path.join(this.rootDir, "runtime-data", "worker-scheduler");
    const memoryDir = path.join(this.rootDir, "memory", "worker-scheduler");
    ensureDir(runtimeDir);
    ensureDir(memoryDir);

    const filename = `worker-scheduler-${timestampForFile()}.json`;
    const runtimePath = path.join(runtimeDir, filename);
    const memoryPath = path.join(memoryDir, filename);
    fs.writeFileSync(runtimePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(memoryPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

    return {
      runtimePath,
      memoryPath
    };
  }
}

module.exports = {
  WorkerScheduler
};
