const fs = require("node:fs");
const path = require("node:path");
const { createDatabaseContext } = require("../database/seed/seed-filesystem-db");
const { RuntimeMetricsCollector } = require("./runtime-metrics-collector");
const { RuntimeTraceManager } = require("./runtime-trace-manager");
const { RuntimeTimelineBuilder } = require("./runtime-timeline-builder");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function toIsoFileStamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(".", "").replace("Z", "Z");
}

function writeJson(filePath, payload) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function compactTrace(trace) {
  return {
    workflowId: trace.workflowId,
    correlationIds: trace.correlationIds,
    executions: trace.executions.length,
    workerAssignments: trace.workerAssignments.length,
    transitions: trace.transitions.length,
    decisions: trace.decisions.length,
    events: trace.events.length,
    rebalances: trace.rebalances.length,
    leases: trace.leases.length,
    problemSignals: trace.problemSignals
  };
}

class RuntimeTelemetryEngine {
  constructor(rootDir = process.cwd(), options = {}) {
    this.rootDir = rootDir;
    this.runtimeDir = options.runtimeDir || path.join(rootDir, "runtime-data", "telemetry");
    this.memoryDir = options.memoryDir || path.join(rootDir, "memory", "telemetry");
    this.collector = options.collector || new RuntimeMetricsCollector(rootDir, options);
    this.traceManager = options.traceManager || new RuntimeTraceManager(rootDir, options);
    this.timelineBuilder = options.timelineBuilder || new RuntimeTimelineBuilder();
  }

  generateReport(options = {}) {
    const generatedAt = new Date().toISOString();
    const telemetryReportId = `telemetry-${toIsoFileStamp(new Date(generatedAt))}`;
    const metricsReport = this.collector.collect();
    const traces = this.traceManager.buildTraces();
    const timelines = this.timelineBuilder.buildTimelines(traces);
    const problematicWorkflows = this.detectProblematicWorkflows(timelines);
    const saturatedWorkers = this.detectSaturatedWorkers(metricsReport.metrics.workerUtilization);
    const correlation = this.buildCorrelation(traces, timelines);
    const fallback = this.buildFallback(metricsReport, traces, timelines);

    const report = {
      telemetryReportId,
      generatedAt,
      version: "telemetry-observability-runtime-v1",
      status: problematicWorkflows.length > 0 || saturatedWorkers.length > 0 ? "attention-required" : "observed",
      readonly: true,
      safetyMode: "observability-only",
      metrics: metricsReport.metrics,
      traces: traces.map(compactTrace),
      timelines,
      problemDetection: {
        problematicWorkflows,
        saturatedWorkers,
        unhealthyWorkers: metricsReport.metrics.unhealthyWorkers
      },
      correlation,
      sources: metricsReport.sources,
      apiLayer: {
        apiReports: metricsReport.metrics.apiReports,
        openApiExports: metricsReport.metrics.openApiExports
      },
      databaseLayer: {
        databaseReports: metricsReport.metrics.databaseReports
      },
      fallback,
      persistence: null,
      databaseMirror: null
    };

    if (options.persist !== false) {
      report.persistence = this.persistReport(report);
      report.databaseMirror = this.persistDatabaseMirror(report);
    }

    return report;
  }

  detectProblematicWorkflows(timelines) {
    return timelines
      .filter((timeline) => timeline.problemSignals.length > 0 || timeline.stages.includes("failed"))
      .map((timeline) => ({
        workflowId: timeline.workflowId,
        correlationIds: timeline.correlationIds,
        stages: timeline.stages,
        problemSignals: timeline.problemSignals,
        lastStage: timeline.entries.length > 0 ? timeline.entries[timeline.entries.length - 1].stage : "unknown"
      }));
  }

  detectSaturatedWorkers(workerUtilization) {
    return workerUtilization
      .filter((worker) => worker.utilization >= 1 || worker.healthStatus === "unhealthy")
      .map((worker) => ({
        workerId: worker.workerId,
        utilization: worker.utilization,
        assigned: worker.assigned,
        concurrencyLimit: worker.concurrencyLimit,
        healthStatus: worker.healthStatus
      }));
  }

  buildCorrelation(traces, timelines) {
    const correlated = traces.filter((trace) =>
      trace.events.length > 0
      && (trace.transitions.length > 0 || trace.decisions.length > 0 || trace.executions.length > 0)
    );

    return {
      workflowCount: traces.length,
      timelineCount: timelines.length,
      correlatedWorkflowCount: correlated.length,
      eventLinkedWorkflows: traces.filter((trace) => trace.events.length > 0).length,
      transitionLinkedWorkflows: traces.filter((trace) => trace.transitions.length > 0).length,
      decisionLinkedWorkflows: traces.filter((trace) => trace.decisions.length > 0).length,
      executionLinkedWorkflows: traces.filter((trace) => trace.executions.length > 0).length,
      correlationIds: [...new Set(traces.flatMap((trace) => trace.correlationIds || []))]
    };
  }

  buildFallback(metricsReport, traces, timelines) {
    const readErrors = Object.values(metricsReport.sources).flatMap((source) => source.readErrors || []);
    const missingSources = metricsReport.fallback?.missingSources || [];

    return {
      safeMode: true,
      reason: missingSources.length > 0 ? "partial-observability-sources" : "all-observability-sources-readable",
      missingSources,
      readErrors,
      emptyTraceSet: traces.length === 0,
      emptyTimelineSet: timelines.length === 0,
      behavior: "telemetry-report-generated-with-available-readonly-sources"
    };
  }

  persistReport(report) {
    ensureDir(this.runtimeDir);
    ensureDir(this.memoryDir);

    const fileName = `${report.telemetryReportId}.json`;
    const runtimePath = path.join(this.runtimeDir, fileName);
    const memoryPath = path.join(this.memoryDir, fileName);
    writeJson(runtimePath, report);
    writeJson(memoryPath, report);

    return {
      runtimePath,
      memoryPath
    };
  }

  persistDatabaseMirror(report) {
    try {
      const database = createDatabaseContext({ rootDir: this.rootDir });
      const result = database.adapter.upsert("runtime_telemetry", {
        telemetryReportId: report.telemetryReportId,
        generatedAt: report.generatedAt,
        status: report.status,
        workflowCount: report.correlation.workflowCount,
        timelineCount: report.correlation.timelineCount,
        problematicWorkflowCount: report.problemDetection.problematicWorkflows.length,
        saturatedWorkerCount: report.problemDetection.saturatedWorkers.length,
        fallback: report.fallback
      });

      return {
        available: Boolean(result.ok),
        operation: result.operation,
        sourcePath: result.sourcePath,
        fallback: result.fallback || null
      };
    } catch (error) {
      return {
        available: false,
        operation: "fallback",
        fallback: {
          safeMode: true,
          reason: "database-mirror-failed",
          error: error.message
        }
      };
    }
  }
}

module.exports = {
  RuntimeTelemetryEngine
};
