const fs = require("node:fs");
const path = require("node:path");
const { RuntimePluginLoader } = require("./runtime-plugin-loader");

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function readonlyClone(value) {
  return Object.freeze(JSON.parse(JSON.stringify(value || {})));
}

class RuntimePluginManager {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.loader = options.loader || new RuntimePluginLoader(options);
    this.registry = this.loader.registry;
    this.loaded = null;
  }

  load() {
    this.loaded = this.loader.loadAll();
    return this.loaded;
  }

  async executeHook(hook, context = {}) {
    if (!this.loaded) {
      this.load();
    }

    const plugins = this.registry.listForHook(hook);
    const executions = [];
    const readOnlyContext = readonlyClone({
      ...context,
      hook,
      readonly: true,
      destructiveActions: false
    });

    for (const plugin of plugins) {
      const handler = plugin.handlers && plugin.handlers[hook];
      if (typeof handler !== "function") {
        executions.push({
          pluginId: plugin.pluginId,
          hook,
          executed: false,
          fallback: {
            safeMode: true,
            reason: "plugin-hook-handler-missing"
          }
        });
        continue;
      }

      try {
        const output = await handler(readOnlyContext);
        const destructive = output && output.destructiveActions === true;
        executions.push({
          pluginId: plugin.pluginId,
          hook,
          executed: !destructive,
          output: destructive ? null : output,
          fallback: destructive
            ? {
                safeMode: true,
                reason: "plugin-destructive-output-blocked"
              }
            : null
        });
      } catch (error) {
        executions.push({
          pluginId: plugin.pluginId,
          hook,
          executed: false,
          fallback: {
            safeMode: true,
            reason: "plugin-hook-execution-failed",
            error: error.message
          }
        });
      }
    }

    return {
      hook,
      executedAt: new Date().toISOString(),
      pluginCount: plugins.length,
      executions,
      fallback: executions.some((execution) => execution.fallback)
        ? {
            safeMode: true,
            reason: "one-or-more-plugin-hooks-used-fallback"
          }
        : null
    };
  }

  async runIntegrationDemoHooks() {
    const hooks = [
      ["beforeWorkflow", { workflowId: "plugin-demo-workflow", source: "worker-runtime" }],
      ["afterWorkflow", { workflowId: "plugin-demo-workflow", status: "completed" }],
      ["beforeDecision", { decisionType: "human-gate", source: "decision-engine" }],
      ["afterDecision", { decisionId: "decision-plugin-demo", severity: "medium" }],
      ["beforeExecution", { executionId: "execution-plugin-demo", workerId: "worker-runtime-backend-1" }],
      ["afterExecution", { executionId: "execution-plugin-demo", status: "completed" }],
      ["beforeTelemetry", { telemetryReportId: "telemetry-plugin-demo", source: "telemetry" }],
      ["afterTelemetry", { dashboardApi: "dashboard-runtime-api-v1", source: "dashboard-api" }]
    ];
    const results = [];

    for (const [hook, context] of hooks) {
      results.push(await this.executeHook(hook, context));
    }

    return results;
  }

  persist(report) {
    const runtimeDir = path.join(this.rootDir, "runtime-data", "plugins");
    const memoryDir = path.join(this.rootDir, "memory", "plugins");
    ensureDir(runtimeDir);
    ensureDir(memoryDir);

    const filename = `plugins-demo-${timestampForFile()}.json`;
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

async function runPluginsDemo() {
  const manager = new RuntimePluginManager();
  const loadReport = manager.load();
  const hookExecutions = await manager.runIntegrationDemoHooks();
  const report = {
    pluginDemoId: `plugins_demo_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    status: loadReport.registeredPlugins.length > 0 && loadReport.rejectedPlugins.length > 0
      ? "plugins_demo_passed"
      : "plugins_demo_attention",
    readonly: true,
    destructiveActions: false,
    loadedPlugins: loadReport.registeredPlugins.map((plugin) => ({
      pluginId: plugin.pluginId,
      type: plugin.type,
      hooks: plugin.hooks,
      dependencies: plugin.dependencies,
      readonly: plugin.readonly,
      enabled: plugin.enabled,
      version: plugin.version
    })),
    rejectedPlugins: loadReport.rejectedPlugins,
    hookExecutions,
    integrations: [
      "Worker Runtime",
      "Event Bus",
      "Decision Engine",
      "Telemetry",
      "Dashboard API"
    ],
    fallback: {
      safeMode: true,
      invalidPluginsBlocked: loadReport.rejectedPlugins.length,
      destructivePluginsAllowed: false
    },
    persistence: null
  };
  report.persistence = manager.persist(report);

  console.log(JSON.stringify(report, null, 2));

  if (report.status !== "plugins_demo_passed") {
    process.exitCode = 1;
  }

  return report;
}

if (require.main === module) {
  runPluginsDemo().catch((error) => {
    console.error(JSON.stringify({
      status: "failed",
      error: error.message,
      fallback: {
        safeMode: true,
        reason: "plugins-demo-error"
      }
    }, null, 2));
    process.exitCode = 1;
  });
}

module.exports = {
  RuntimePluginManager,
  runPluginsDemo
};
