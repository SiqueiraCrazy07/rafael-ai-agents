const fs = require("node:fs");
const path = require("node:path");

const { IncidentForecastEngine } = require("./incidents/incident-forecast-engine");
const { PredictiveRoutingAdvisor } = require("./risk/predictive-routing-advisor");
const { PredictiveThrottlingEngine } = require("./risk/predictive-throttling-engine");
const { RuntimeForecastEngine } = require("./risk/runtime-forecast-engine");
const { RuntimeRiskPredictor } = require("./risk/runtime-risk-predictor");
const { PredictiveHealthAnalyzer } = require("./scoring/predictive-health-analyzer");
const { PredictiveMemoryLoader } = require("./telemetry/predictive-memory-loader");
const { WorkerSaturationPredictor } = require("./workers/worker-saturation-predictor");
const { WorkflowFailurePredictor } = require("./workflows/workflow-failure-predictor");

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

function persistForecast(forecast, rootDir = process.cwd()) {
  const runtimeDir = path.join(rootDir, "runtime-data", "predictive");
  const memoryDir = path.join(rootDir, "memory", "predictive");
  ensureDirectory(runtimeDir);
  ensureDirectory(memoryDir);

  const filename = `runtime-forecast-${timestampForFile()}.json`;
  const runtimePath = path.join(runtimeDir, filename);
  const memoryPath = path.join(memoryDir, filename);

  fs.writeFileSync(runtimePath, `${JSON.stringify(forecast, null, 2)}\n`, "utf8");
  fs.writeFileSync(memoryPath, `${JSON.stringify(forecast, null, 2)}\n`, "utf8");

  return {
    runtimePath,
    memoryPath
  };
}

function runPredictiveRuntimeDemo() {
  const memory = new PredictiveMemoryLoader().load();
  const workflowPredictions = new WorkflowFailurePredictor().predict(memory);
  const workerPredictions = new WorkerSaturationPredictor().predict(memory);
  const incidentForecast = new IncidentForecastEngine().forecast(memory);
  const runtimeRisk = new RuntimeRiskPredictor().predict({
    workflowPredictions,
    workerPredictions,
    incidentForecast,
    memory
  });
  const predictiveHealth = new PredictiveHealthAnalyzer().analyze({
    runtimeRisk,
    incidentForecast,
    memory
  });
  const routingAdvice = new PredictiveRoutingAdvisor().advise({
    workerPredictions,
    workflowPredictions
  });
  const throttling = new PredictiveThrottlingEngine().recommend({
    runtimeRisk,
    predictiveHealth,
    workflowPredictions
  });
  const forecast = new RuntimeForecastEngine().generate({
    workflowPredictions,
    workerPredictions,
    incidentForecast,
    runtimeRisk,
    predictiveHealth,
    routingAdvice,
    throttling
  });

  const report = {
    forecastId: `predictive_${Date.now()}`,
    memoryLoaded: {
      incidents: memory.incidents.length,
      healthReports: memory.healthReports.length,
      workflowReports: memory.workflowReports.length,
      routingDecisions: memory.routingDecisions.length,
      queueReports: memory.queueReports.length,
      runtimeRecoveries: memory.runtimeRecoveries.length,
      policyDecisions: memory.policyDecisions.length
    },
    ...forecast
  };
  const persistence = persistForecast(report);

  console.log(
    JSON.stringify(
      {
        forecastId: report.forecastId,
        memoryLoaded: report.memoryLoaded,
        degradationTrend: report.degradationTrend,
        criticalWorkflows: report.criticalWorkflows.map((workflow) => ({
          workflow: workflow.workflow,
          failureProbability: workflow.failureProbability,
          forecast: workflow.forecast
        })),
        saturatedWorkers: report.saturatedWorkers.map((worker) => ({
          workerId: worker.workerId,
          saturationScore: worker.saturationScore,
          forecast: worker.forecast
        })),
        incidentForecast: report.incidentForecast,
        runtimeRisk: report.runtimeRisk,
        predictiveHealth: report.predictiveHealth,
        throttling: report.recommendations.throttling,
        rerouting: report.recommendations.routing,
        actions: report.recommendations.actions,
        persistence
      },
      null,
      2
    )
  );
}

runPredictiveRuntimeDemo();
