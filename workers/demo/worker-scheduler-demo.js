const { WorkerScheduler } = require("../scheduler/worker-scheduler");

async function main() {
  const scheduler = new WorkerScheduler();
  const report = scheduler.schedule();
  const output = {
    workerSchedulerReportId: report.workerSchedulerReportId,
    status: report.status,
    readonly: report.readonly,
    destructiveActions: report.destructiveActions,
    scheduleStrategy: report.scheduleStrategy,
    workload: report.plan.workload,
    forecast: report.plan.forecast,
    executionPlans: report.plan.executionPlans.map((item) => ({
      workflowId: item.workflowId,
      action: item.action,
      selectedWorkerId: item.route.selectedWorkerId,
      avoidedWorkers: item.route.avoidedWorkers.map((worker) => ({
        workerId: worker.workerId,
        reason: worker.reason
      })),
      priorityScore: item.priority.score,
      priorityReasons: item.priority.reasons,
      windowType: item.window.type,
      scheduledAt: item.window.scheduledAt,
      retryScheduled: item.retry.scheduled,
      protectedQueueRelease: item.protectedQueue.releaseAllowed,
      reason: item.reason
    })),
    retriesPlanned: report.scheduledJobs.filter((job) => job.retryScheduled),
    protectedQueue: report.scheduledJobs.filter((job) => job.action === "protected-queue"),
    intelligentRouting: report.scheduledJobs.map((job) => ({
      workflowId: job.workflowId,
      selectedWorkerId: job.selectedWorkerId,
      windowType: job.windowType,
      priorityScore: job.priorityScore
    })),
    integrations: report.plan.integrations,
    sourceSummary: report.plan.sourceSummary,
    fallback: report.fallback,
    persistence: report.persistence
  };

  console.log(JSON.stringify(output, null, 2));

  if (report.status !== "worker_scheduler_plan_created") {
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
        reason: "worker-scheduler-demo-error"
      }
    }, null, 2));
    process.exitCode = 1;
  });
}
