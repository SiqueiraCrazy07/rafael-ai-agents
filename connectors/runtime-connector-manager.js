const fs = require("node:fs");
const path = require("node:path");
const { RuntimeConnectorLoader } = require("./runtime-connector-loader");

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function readonlyClone(value) {
  return Object.freeze(JSON.parse(JSON.stringify(value || {})));
}

class RuntimeConnectorManager {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.loader = options.loader || new RuntimeConnectorLoader(options);
    this.registry = this.loader.registry;
    this.loaded = null;
  }

  load() {
    this.loaded = this.loader.loadAll();
    return this.loaded;
  }

  async checkHealth() {
    if (!this.loaded) {
      this.load();
    }

    const checks = [];
    for (const connector of this.registry.list()) {
      const handler = connector.handlers && connector.handlers.healthCheck;
      if (typeof handler !== "function") {
        checks.push({
          connectorId: connector.connectorId,
          healthStatus: connector.healthStatus,
          checked: false,
          fallback: {
            safeMode: true,
            reason: "connector-health-handler-missing"
          }
        });
        continue;
      }

      try {
        const result = await handler(readonlyClone({
          connectorId: connector.connectorId,
          readonly: true,
          destructiveActions: false
        }));
        checks.push({
          connectorId: connector.connectorId,
          healthStatus: result.healthStatus || connector.healthStatus,
          checked: true,
          result,
          fallback: result.healthStatus === "unhealthy"
            ? {
                safeMode: true,
                reason: "connector-health-unhealthy"
              }
            : null
        });
      } catch (error) {
        checks.push({
          connectorId: connector.connectorId,
          healthStatus: "unhealthy",
          checked: false,
          fallback: {
            safeMode: true,
            reason: "connector-health-check-failed",
            error: error.message
          }
        });
      }
    }

    return {
      checkedAt: new Date().toISOString(),
      checks,
      unhealthyConnectors: checks.filter((check) => check.healthStatus === "unhealthy"),
      fallback: checks.some((check) => check.fallback)
        ? {
            safeMode: true,
            reason: "one-or-more-connectors-used-fallback"
          }
        : null
    };
  }

  async executeCapability(capability, context = {}) {
    if (!this.loaded) {
      this.load();
    }

    const executions = [];
    const connectors = this.registry.list({ enabledOnly: true })
      .filter((connector) => connector.readonly === true && connector.capabilities.includes(capability));

    for (const connector of connectors) {
      if (connector.healthStatus === "unhealthy") {
        executions.push({
          connectorId: connector.connectorId,
          capability,
          executed: false,
          fallback: {
            safeMode: true,
            reason: "connector-unhealthy-skipped"
          }
        });
        continue;
      }

      const handler = connector.handlers && connector.handlers.execute;
      if (typeof handler !== "function") {
        executions.push({
          connectorId: connector.connectorId,
          capability,
          executed: false,
          fallback: {
            safeMode: true,
            reason: "connector-execute-handler-missing"
          }
        });
        continue;
      }

      try {
        const output = await handler(readonlyClone({
          ...context,
          capability,
          readonly: true,
          destructiveActions: false
        }));
        const destructive = output && output.destructiveActions === true;
        executions.push({
          connectorId: connector.connectorId,
          capability,
          executed: !destructive,
          output: destructive ? null : output,
          fallback: destructive
            ? {
                safeMode: true,
                reason: "connector-destructive-output-blocked"
              }
            : null
        });
      } catch (error) {
        executions.push({
          connectorId: connector.connectorId,
          capability,
          executed: false,
          fallback: {
            safeMode: true,
            reason: "connector-execution-failed",
            error: error.message
          }
        });
      }
    }

    return {
      capability,
      executedAt: new Date().toISOString(),
      connectorCount: connectors.length,
      executions,
      fallback: executions.some((execution) => execution.fallback)
        ? {
            safeMode: true,
            reason: "one-or-more-connector-executions-used-fallback"
          }
        : null
    };
  }

  persist(report) {
    const runtimeDir = path.join(this.rootDir, "runtime-data", "connectors");
    const memoryDir = path.join(this.rootDir, "memory", "connectors");
    ensureDir(runtimeDir);
    ensureDir(memoryDir);

    const filename = `connectors-demo-${timestampForFile()}.json`;
    const runtimePath = path.join(runtimeDir, filename);
    const memoryPath = path.join(memoryDir, filename);
    fs.writeFileSync(runtimePath, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(memoryPath, `${JSON.stringify(report, null, 2)}\n`);

    return {
      runtimePath,
      memoryPath
    };
  }
}

async function runConnectorsDemo() {
  const manager = new RuntimeConnectorManager();
  const loadReport = manager.load();
  const health = await manager.checkHealth();
  const telemetryRead = await manager.executeCapability("telemetry-read", {
    source: "telemetry",
    integration: "Telemetry"
  });
  const dashboardRead = await manager.executeCapability("dashboard-read", {
    source: "dashboard-api",
    integration: "Dashboard API"
  });
  const report = {
    connectorDemoId: `connectors_demo_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    status: loadReport.registeredConnectors.length > 0 && health.unhealthyConnectors.length > 0
      ? "connectors_demo_passed"
      : "connectors_demo_attention",
    readonly: true,
    destructiveActions: false,
    loadedConnectors: loadReport.registeredConnectors.map((connector) => ({
      connectorId: connector.connectorId,
      capabilities: connector.capabilities,
      readonly: connector.readonly,
      enabled: connector.enabled,
      authRequired: connector.authRequired,
      healthStatus: connector.healthStatus,
      version: connector.version,
      metadata: connector.metadata
    })),
    rejectedConnectors: loadReport.rejectedConnectors,
    unhealthyConnectors: health.unhealthyConnectors,
    health,
    capabilityExecutions: [
      telemetryRead,
      dashboardRead
    ],
    integrations: [
      "Worker Runtime",
      "Event Bus",
      "Decision Engine",
      "Telemetry",
      "Dashboard API"
    ],
    fallback: {
      safeMode: true,
      unhealthyConnectorsSkipped: health.unhealthyConnectors.length,
      connectorsWithoutGovernanceAllowed: false,
      destructiveConnectorsAllowed: false
    },
    persistence: null
  };
  report.persistence = manager.persist(report);

  console.log(JSON.stringify(report, null, 2));

  if (report.status !== "connectors_demo_passed") {
    process.exitCode = 1;
  }

  return report;
}

if (require.main === module) {
  runConnectorsDemo().catch((error) => {
    console.error(JSON.stringify({
      status: "failed",
      error: error.message,
      fallback: {
        safeMode: true,
        reason: "connectors-demo-error"
      }
    }, null, 2));
    process.exitCode = 1;
  });
}

module.exports = {
  RuntimeConnectorManager,
  runConnectorsDemo
};
