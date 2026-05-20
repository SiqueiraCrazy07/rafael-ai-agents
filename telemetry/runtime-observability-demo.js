const { RuntimeTelemetryEngine } = require("./runtime-telemetry-engine");

function compactTimeline(timeline) {
  return {
    workflowId: timeline.workflowId,
    correlationIds: timeline.correlationIds,
    stages: timeline.stages,
    problemSignals: timeline.problemSignals,
    entries: timeline.entries.slice(0, 12)
  };
}

function runRuntimeObservabilityDemo(options = {}) {
  const engine = new RuntimeTelemetryEngine(process.cwd());
  const report = engine.generateReport();

  if (options.timelineOnly) {
    return {
      demo: "telemetry:timeline-demo",
      telemetryReportId: report.telemetryReportId,
      generatedAt: report.generatedAt,
      timelinesGenerated: report.timelines.length,
      timelines: report.timelines.slice(0, 12).map(compactTimeline),
      omittedTimelines: Math.max(report.timelines.length - 12, 0),
      problematicWorkflows: report.problemDetection.problematicWorkflows,
      correlation: report.correlation,
      fallback: report.fallback,
      persistence: report.persistence
    };
  }

  return {
    demo: "telemetry:demo",
    telemetryReportId: report.telemetryReportId,
    generatedAt: report.generatedAt,
    status: report.status,
    metrics: report.metrics,
    tracesGenerated: report.traces.length,
    timelinesGenerated: report.timelines.length,
    sampleTraces: report.traces.slice(0, 10),
    problemDetection: report.problemDetection,
    correlation: report.correlation,
    apiLayer: report.apiLayer,
    databaseMirror: report.databaseMirror,
    fallback: report.fallback,
    persistence: report.persistence
  };
}

if (require.main === module) {
  const timelineOnly = process.argv.includes("--timeline");
  const output = runRuntimeObservabilityDemo({ timelineOnly });
  console.log(JSON.stringify(output, null, 2));
}

module.exports = {
  runRuntimeObservabilityDemo
};
