const { WorkerScheduler } = require("../../workers/scheduler/worker-scheduler");

class AutonomousTaskDispatcher {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.scheduler = options.scheduler || new WorkerScheduler(options);
  }

  dispatch(plan) {
    const schedulerReport = this.scheduler.schedule();
    const jobs = plan.subtasks.map((task) => ({
      jobId: `autonomous-job-${task.taskId}`,
      workflowId: task.taskId,
      project: "platform",
      priority: task.risk === "high" ? "gated" : task.risk === "low" ? "p3" : "p1",
      requiredCapability: "runtime-read",
      readonly: true,
      sandboxRequired: true,
      pluginHooksReadonly: true,
      connectorsReadonly: true,
      validations: task.validations,
      fallback: task.fallback,
      dispatchStatus: task.governance.allowed ? "simulated-dispatched" : "blocked-by-governance",
      reason: task.governance.allowed
        ? "task converted to readonly scheduler job"
        : "governance blocked task dispatch"
    }));

    return {
      dispatchId: `autonomous_dispatch_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      readonly: true,
      destructiveActions: false,
      mode: "simulated-dispatch",
      jobs,
      scheduler: {
        workerSchedulerReportId: schedulerReport.workerSchedulerReportId,
        status: schedulerReport.status,
        scheduledJobs: schedulerReport.scheduledJobs,
        fallback: schedulerReport.fallback,
        persistence: schedulerReport.persistence
      },
      integration: {
        workerScheduler: true,
        sandboxRequired: true,
        pluginHooksReadonly: true,
        connectorsReadonly: true
      },
      fallback: {
        safeMode: true,
        behavior: "dispatch is declarative; no worker execution is triggered"
      }
    };
  }
}

module.exports = {
  AutonomousTaskDispatcher
};
