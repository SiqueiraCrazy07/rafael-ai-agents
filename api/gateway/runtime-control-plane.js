const fs = require("node:fs");
const path = require("node:path");

function safeReadLatestJson(rootDir, relativeDir) {
  const directory = path.join(rootDir, relativeDir);
  if (!fs.existsSync(directory)) {
    return {
      source: relativeDir,
      available: false,
      sourcePath: null,
      data: null,
      readErrors: [],
      fallback: { used: true, reason: "directory-unavailable" }
    };
  }
  const files = fs.readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const sourcePath = path.join(directory, file);
      return { sourcePath, mtimeMs: fs.statSync(sourcePath).mtimeMs };
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs);
  if (!files.length) {
    return {
      source: relativeDir,
      available: false,
      sourcePath: null,
      data: null,
      readErrors: [],
      fallback: { used: true, reason: "no-json-reports" }
    };
  }
  try {
    const data = JSON.parse(fs.readFileSync(files[0].sourcePath, "utf8"));
    return {
      source: relativeDir,
      available: true,
      sourcePath: files[0].sourcePath,
      data,
      readErrors: [],
      fallback: { used: false, reason: null }
    };
  } catch (error) {
    return {
      source: relativeDir,
      available: false,
      sourcePath: files[0].sourcePath,
      data: null,
      readErrors: [{ sourcePath: files[0].sourcePath, error: error.message }],
      fallback: { used: true, reason: "latest-json-invalid" }
    };
  }
}

class RuntimeControlPlane {
  constructor({ rootDir = process.cwd() } = {}) {
    this.rootDir = rootDir;
  }

  inspect(route) {
    const source = safeReadLatestJson(this.rootDir, route.source);
    return {
      inspectionId: `control_plane_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      type: route.controlPlane,
      routePath: route.path,
      source: source.source,
      sourcePath: source.sourcePath,
      available: source.available,
      data: this.compactData(route, source.data),
      readErrors: source.readErrors,
      fallback: source.fallback,
      readonly: true,
      safetyMode: "readonly-safe-runtime-control-plane"
    };
  }

  compactData(route, data) {
    if (!data) {
      return null;
    }
    return {
      status: data.status || "available",
      generatedAt: data.generatedAt || null,
      reportId: data.distributedRuntimeDemoId || data.distributedQueueReportId || data.replayDemoId || data.runtimeRecoveryDemoId || data.streamingDemoId || data.replicationReportId || data.telemetryReportId || data.dashboardWebDemoId || data.redisStreamsDemoId || data.multiprocessWorkerDemoId || null,
      routeType: route.controlPlane,
      summary: {
        readonly: data.readonly !== false,
        destructiveActions: data.destructiveActions === true ? true : false,
        fallback: data.fallback || null,
        integrations: data.integrations || null
      }
    };
  }
}

module.exports = {
  RuntimeControlPlane,
  safeReadLatestJson
};
