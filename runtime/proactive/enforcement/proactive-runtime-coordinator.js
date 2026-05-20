const fs = require("node:fs");
const path = require("node:path");

const { ForecastEnforcementPolicyEngine } = require("./forecast-enforcement-policy-engine");
const { ForecastLoader } = require("./forecast-loader");
const { RuntimeEnforcementCoordinator } = require("./runtime-enforcement-coordinator");

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

class ProactiveRuntimeCoordinator {
  constructor(rootDir = process.cwd()) {
    this.rootDir = rootDir;
    this.forecastLoader = new ForecastLoader(rootDir);
    this.policyEngine = new ForecastEnforcementPolicyEngine();
    this.enforcementCoordinator = new RuntimeEnforcementCoordinator();
  }

  run() {
    const latestForecast = this.forecastLoader.latest();
    if (!latestForecast) {
      return {
        enforcementId: `proactive_${Date.now()}`,
        generatedAt: new Date().toISOString(),
        status: "no_forecast_available",
        actions: []
      };
    }

    const forecast = latestForecast.data;
    const policy = this.policyEngine.evaluate(forecast);
    const actions = this.enforcementCoordinator.coordinate({ forecast, policy });
    const report = {
      enforcementId: `proactive_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      status: actions.length > 0 ? "enforcement_applied" : "no_enforcement_required",
      forecastSource: latestForecast.path,
      forecastId: forecast.forecastId,
      policy,
      summary: {
        throttlingApplied: actions.filter((action) => action.type === "predictive-throttling").length,
        workflowsBlocked: actions.filter((action) => action.type === "predictive-workflow-block").length,
        reroutingRulesApplied: actions.filter((action) => action.type === "predictive-rerouting").length,
        humanGatesRequired: actions.filter((action) => action.type === "predictive-human-gate").length,
        recoveryTriggers: actions.filter((action) => action.type === "predictive-recovery-trigger").length
      },
      actions,
      forecastSnapshot: {
        degradationTrend: forecast.degradationTrend,
        runtimeRisk: forecast.runtimeRisk,
        predictiveHealth: forecast.predictiveHealth,
        criticalWorkflows: forecast.criticalWorkflows,
        saturatedWorkers: forecast.saturatedWorkers
      }
    };

    return report;
  }

  persist(report) {
    const runtimeDir = path.join(this.rootDir, "runtime-data", "proactive");
    const memoryDir = path.join(this.rootDir, "memory", "proactive");
    ensureDirectory(runtimeDir);
    ensureDirectory(memoryDir);

    const filename = `proactive-enforcement-${timestampForFile()}.json`;
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
  ProactiveRuntimeCoordinator
};
