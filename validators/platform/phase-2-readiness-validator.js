const fs = require("node:fs");
const path = require("node:path");

const ROOT_DIR = process.cwd();

const REQUIRED_DOCS = [
  "docs/platform/api-server-foundation-v1.md",
  "docs/platform/api-contracts-schema-validation-v1.md",
  "docs/platform/api-auth-governance-v1.md",
  "docs/platform/api-openapi-contract-export-v1.md",
  "docs/platform/persistent-database-layer-v1.md",
  "docs/platform/api-database-read-integration-v1.md",
  "docs/platform/dashboard-runtime-api-v1.md",
  "docs/platform/dashboard-web-v1.md",
  "docs/platform/plugin-connector-system-v1.md",
  "docs/platform/worker-execution-runtime-v1.md",
  "docs/platform/worker-sandbox-isolation-v1.md",
  "docs/platform/worker-scheduler-execution-planner-v1.md",
  "docs/platform/autonomous-cognitive-orchestrator-v1.md",
  "docs/platform/phase-2-platform-execution-closure-v1.md",
  "docs/platform/phase-3-planning-v1.md"
];

const REQUIRED_SCRIPTS = [
  "api:demo",
  "api:validate-demo",
  "api:auth-demo",
  "api:governance-demo",
  "api:db-read-demo",
  "api:env-demo",
  "api:openapi-demo",
  "db:demo",
  "db:mirror-demo",
  "db:queue-demo",
  "db:idempotency-demo",
  "dashboard:api-demo",
  "dashboard:web-demo",
  "plugins:demo",
  "connectors:demo",
  "workers:demo",
  "workers:sandbox-demo",
  "workers:scheduler-demo",
  "autonomous:plan-demo",
  "autonomous:demo",
  "telemetry:demo",
  "governance:validate",
  "validate",
  "normalize"
];

const REQUIRED_DIRECTORIES = [
  "api",
  "database",
  "dashboard",
  "plugins",
  "connectors",
  "workers",
  "orchestrator/autonomous",
  "telemetry",
  "memory/api",
  "memory/database",
  "memory/dashboard-web",
  "memory/plugins",
  "memory/connectors",
  "memory/workers",
  "memory/worker-sandbox",
  "memory/worker-scheduler",
  "memory/autonomous-orchestrator",
  "runtime-data/api",
  "runtime-data/database",
  "runtime-data/dashboard-web",
  "runtime-data/plugins",
  "runtime-data/connectors",
  "runtime-data/workers",
  "runtime-data/worker-sandbox",
  "runtime-data/worker-scheduler",
  "runtime-data/autonomous-orchestrator"
];

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT_DIR, relativePath));
}

function hasJsonFiles(relativePath) {
  const directory = path.join(ROOT_DIR, relativePath);
  if (!fs.existsSync(directory)) {
    return false;
  }
  return fs.readdirSync(directory).some((file) => file.endsWith(".json") || file.endsWith(".jsonl"));
}

function loadPackageScripts() {
  const packagePath = path.join(ROOT_DIR, "package.json");
  const data = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  return data.scripts || {};
}

function persist(report) {
  const runtimeDir = path.join(ROOT_DIR, "runtime-data", "phase-2-closure");
  const memoryDir = path.join(ROOT_DIR, "memory", "phase-2-closure");
  ensureDir(runtimeDir);
  ensureDir(memoryDir);
  const filename = `phase-2-readiness-${timestampForFile()}.json`;
  const runtimePath = path.join(runtimeDir, filename);
  const memoryPath = path.join(memoryDir, filename);
  fs.writeFileSync(runtimePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(memoryPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return { runtimePath, memoryPath };
}

function validatePhase2Readiness() {
  const scripts = loadPackageScripts();
  const docs = REQUIRED_DOCS.map((file) => ({
    file,
    exists: exists(file)
  }));
  const scriptChecks = REQUIRED_SCRIPTS.map((script) => ({
    script,
    exists: Boolean(scripts[script])
  }));
  const directoryChecks = REQUIRED_DIRECTORIES.map((directory) => ({
    directory,
    exists: exists(directory),
    hasReports: directory.startsWith("memory/") || directory.startsWith("runtime-data/")
      ? hasJsonFiles(directory)
      : null
  }));
  const errors = [
    ...docs.filter((item) => !item.exists).map((item) => `missing doc: ${item.file}`),
    ...scriptChecks.filter((item) => !item.exists).map((item) => `missing script: ${item.script}`),
    ...directoryChecks.filter((item) => !item.exists).map((item) => `missing directory: ${item.directory}`)
  ];
  const reportDirectoriesWithoutReports = directoryChecks
    .filter((item) => item.exists && item.hasReports === false)
    .map((item) => item.directory);

  const report = {
    phase2ReadinessReportId: `phase_2_readiness_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    status: errors.length === 0 ? "fase-2-ready" : "fase-2-not-ready",
    valid: errors.length === 0,
    readonly: true,
    destructiveActions: false,
    checks: {
      docs,
      scripts: scriptChecks,
      directories: directoryChecks
    },
    warnings: reportDirectoriesWithoutReports.map((directory) => ({
      directory,
      warning: "directory exists but no json/jsonl report was found"
    })),
    errors,
    readiness: {
      apiServer: scriptChecks.some((item) => item.script === "api:demo" && item.exists),
      databaseLayer: scriptChecks.some((item) => item.script === "db:demo" && item.exists),
      workerRuntime: scriptChecks.some((item) => item.script === "workers:demo" && item.exists),
      dashboard: scriptChecks.some((item) => item.script === "dashboard:web-demo" && item.exists),
      pluginSystem: scriptChecks.some((item) => item.script === "plugins:demo" && item.exists),
      scheduler: scriptChecks.some((item) => item.script === "workers:scheduler-demo" && item.exists),
      autonomousOrchestrator: scriptChecks.some((item) => item.script === "autonomous:demo" && item.exists)
    },
    fallback: {
      safeMode: true,
      behavior: "validator only checks local files, scripts and persisted reports; it does not execute destructive actions"
    },
    persistence: null
  };
  report.persistence = persist(report);
  return report;
}

if (require.main === module) {
  const report = validatePhase2Readiness();
  console.log(JSON.stringify(report, null, 2));
  if (!report.valid) {
    process.exitCode = 1;
  }
}

module.exports = {
  validatePhase2Readiness
};
