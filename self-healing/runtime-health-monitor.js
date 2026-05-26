const path = require("node:path");
const { readJsonDir } = require("./recovery-audit");

class RuntimeHealthMonitor {
  constructor({ rootDir = process.cwd() } = {}) {
    this.rootDir = rootDir;
  }

  scan() {
    const workerReports = this.readLatest(path.join(this.rootDir, "memory", "workers"), "workerRuntimeReportId");
    const schedulerReports = this.readLatest(path.join(this.rootDir, "memory", "worker-scheduler"), "schedulerReportId");
    const executionFailures = this.readAll(path.join(this.rootDir, "memory", "execution-persistence", "failures"), "failureId");
    const checkpoints = this.readAll(path.join(this.rootDir, "memory", "execution-persistence", "checkpoints"), "checkpointId");
    const replayReports = this.readLatest(path.join(this.rootDir, "memory", "replay"), "replayId");
    const eventReports = this.readLatest(path.join(this.rootDir, "memory", "event-bus"), "eventBusDemoId");

    const signals = [];
    signals.push(...this.detectUnhealthyWorkers(workerReports.records));
    signals.push(...this.detectWorkflowStalled(workerReports.records));
    signals.push(...this.detectRetryStorm(workerReports.records, schedulerReports.records));
    signals.push(...this.detectQueueSaturation(workerReports.records, schedulerReports.records));
    signals.push(...this.detectCheckpointInconsistency(checkpoints.records));
    signals.push(...this.detectEventStreamGap(eventReports.records, replayReports.records));
    signals.push(...this.detectExecutionFailures(executionFailures.records));

    return {
      scanId: `runtime_health_scan_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      signals,
      sources: {
        workerReports: workerReports.records.length,
        schedulerReports: schedulerReports.records.length,
        executionFailures: executionFailures.records.length,
        checkpoints: checkpoints.records.length,
        replayReports: replayReports.records.length,
        eventReports: eventReports.records.length
      },
      readErrors: [
        ...workerReports.readErrors,
        ...schedulerReports.readErrors,
        ...executionFailures.readErrors,
        ...checkpoints.readErrors,
        ...replayReports.readErrors,
        ...eventReports.readErrors
      ],
      missingSources: [
        ...workerReports.missingSources,
        ...schedulerReports.missingSources,
        ...executionFailures.missingSources,
        ...checkpoints.missingSources,
        ...replayReports.missingSources,
        ...eventReports.missingSources
      ],
      fallback: {
        safeMode: true,
        reason: "runtime-health-monitor-readonly-scan"
      }
    };
  }

  readLatest(directory, idField) {
    const read = this.readAll(directory, idField);
    return {
      ...read,
      records: read.records
        .sort((left, right) =>
          String(right.generatedAt || right.createdAt || "").localeCompare(String(left.generatedAt || left.createdAt || ""))
        )
        .slice(0, 5)
    };
  }

  readAll(directory, idField) {
    const read = readJsonDir(directory, idField);
    return {
      records: read.records,
      readErrors: read.readErrors,
      missingSources: read.missing ? [directory] : []
    };
  }

  signal(type, reason, evidence = {}, severity = "medium", source = "runtime-health-monitor") {
    return {
      signalId: `health_signal_${type}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      type,
      severity,
      source,
      reason,
      evidence,
      detectedAt: new Date().toISOString(),
      safetyMode: "readonly-safe-health-signal"
    };
  }

  detectUnhealthyWorkers(reports) {
    const signals = [];
    for (const report of reports) {
      const unhealthy = report.heartbeat?.unhealthyWorkers || report.fallback?.unhealthyWorkersAvoided || [];
      for (const workerId of [...new Set(unhealthy)]) {
        signals.push(this.signal("worker-unhealthy", "worker unhealthy detected", { workerId, reportId: report.workerRuntimeReportId }));
      }
    }
    return signals;
  }

  detectWorkflowStalled(reports) {
    const signals = [];
    for (const report of reports) {
      for (const item of report.executionLifecycle || []) {
        if (["waiting_worker", "running", "queued"].includes(item.status)) {
          signals.push(
            this.signal("workflow-stalled", "workflow stalled or waiting for worker", {
              workflowId: item.workflowId,
              executionId: item.executionId,
              correlationId: item.correlationId,
              status: item.status
            })
          );
        }
      }
    }
    return signals;
  }

  detectRetryStorm(workerReports, schedulerReports) {
    const retryCount =
      workerReports.reduce((total, report) => total + (report.retryItems || []).length, 0) +
      schedulerReports.reduce((total, report) => total + (report.plan?.items || report.executionPlans || []).filter?.((item) => item.action === "retry").length || 0, 0);
    return retryCount >= 3
      ? [this.signal("retry-storm", "retry storm risk detected", { retryCount }, "high")]
      : retryCount > 0
        ? [this.signal("retry-storm", "retry activity detected", { retryCount }, "low")]
        : [];
  }

  detectQueueSaturation(workerReports, schedulerReports) {
    const protectedCount =
      workerReports.reduce((total, report) => total + (report.protectedQueue || []).length, 0) +
      schedulerReports.reduce((total, report) => total + (report.protectedPlans || report.protectedQueue || []).length, 0);
    return protectedCount > 0
      ? [this.signal("queue-saturation", "queue saturation or protected queue pressure detected", { protectedCount })]
      : [];
  }

  detectCheckpointInconsistency(checkpoints) {
    return checkpoints
      .filter((checkpoint) => !checkpoint.consistencyMarker || checkpoint.consistencyMarker.readonly !== true)
      .map((checkpoint) =>
        this.signal(
          "checkpoint-inconsistency",
          "checkpoint inconsistency detected",
          { checkpointId: checkpoint.checkpointId, executionId: checkpoint.executionId },
          "high"
        )
      );
  }

  detectEventStreamGap(eventReports, replayReports) {
    const signals = [];
    for (const report of replayReports) {
      const warnings = report.validation?.warnings || [];
      if (warnings.some((warning) => String(warning).includes("no-events"))) {
        signals.push(this.signal("event-stream-gap", "replay inconsistency: no events found", { replayId: report.replayId }, "high"));
      }
    }
    for (const report of eventReports) {
      if (report.overflowProtection?.rejectedStatus === "backpressure-rejected") {
        signals.push(this.signal("event-stream-gap", "event stream overflow protection triggered", { eventBusDemoId: report.eventBusDemoId }));
      }
    }
    return signals;
  }

  detectExecutionFailures(failures) {
    return failures.map((failure) =>
      this.signal(
        "execution-failure",
        failure.error?.message || failure.failureType || "execution failure detected",
        {
          failureId: failure.failureId,
          failureType: failure.failureType,
          executionId: failure.executionId,
          workflowId: failure.workflowId,
          workerId: failure.workerId
        },
        failure.retryEligible ? "medium" : "high",
        "execution-persistence"
      )
    );
  }
}

module.exports = {
  RuntimeHealthMonitor
};
