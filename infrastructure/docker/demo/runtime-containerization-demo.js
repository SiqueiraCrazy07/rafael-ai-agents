const fs = require("node:fs");
const path = require("node:path");
const { RuntimeContainerAudit } = require("../runtime-container-audit");
const { RuntimeContainerHealth } = require("../runtime-container-health");
const { RuntimeContainerPolicy } = require("../runtime-container-policy");
const { RuntimeContainerRegistry } = require("../runtime-container-registry");

function fileExists(rootDir, relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

function readLatestSource(rootDir, relativeDir) {
  const directory = path.join(rootDir, relativeDir);
  if (!fs.existsSync(directory)) {
    return { available: false, sourcePath: null, fallback: { safeMode: true, reason: "directory-unavailable" } };
  }
  const files = fs.readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const sourcePath = path.join(directory, file);
      return { sourcePath, mtimeMs: fs.statSync(sourcePath).mtimeMs };
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs);
  return files[0]
    ? { available: true, sourcePath: files[0].sourcePath, fallback: null }
    : { available: false, sourcePath: null, fallback: { safeMode: true, reason: "no-json-reports" } };
}

function seedContainers(registry) {
  const commonEnv = {
    RUNTIME_READONLY_MODE: "true",
    RUNTIME_SAFE_MODE: "true",
    JSON_FALLBACK_ENABLED: "true"
  };
  return [
    registry.register({
      service: "runtime-core",
      role: "runtime core",
      image: "rafael-ai-agents/runtime-core:v1-readonly",
      dockerfile: "infrastructure/docker/runtime.Dockerfile",
      serviceMapping: "Distributed Runtime Coordinator",
      capabilities: ["runtime-read", "cluster-inspection", "queue-read"],
      mounts: [{ target: "/app/runtime-data" }, { target: "/app/memory" }],
      environment: commonEnv
    }),
    registry.register({
      service: "workers",
      role: "workers",
      image: "rafael-ai-agents/workers:v1-readonly",
      dockerfile: "infrastructure/docker/worker.Dockerfile",
      serviceMapping: "Multi-process Workers",
      capabilities: ["worker-read", "execution-metadata"],
      mounts: [{ target: "/app/runtime-data" }, { target: "/app/memory" }],
      environment: { ...commonEnv, WORKER_EXECUTION_MODE: "readonly-simulated" }
    }),
    registry.register({
      service: "gateway",
      role: "gateway",
      image: "rafael-ai-agents/gateway:v1-readonly",
      dockerfile: "infrastructure/docker/gateway.Dockerfile",
      serviceMapping: "Runtime API Gateway",
      capabilities: ["gateway-read", "rbac-enforcement"],
      mounts: [{ target: "/app/runtime-data" }, { target: "/app/memory" }],
      environment: { ...commonEnv, RUNTIME_GATEWAY_PUBLIC: "false" }
    }),
    registry.register({
      service: "streaming",
      role: "streaming",
      image: "rafael-ai-agents/streaming:v1-readonly",
      dockerfile: "infrastructure/docker/streaming.Dockerfile",
      serviceMapping: "Runtime Streaming",
      capabilities: ["stream-read", "snapshot-fallback"],
      mounts: [{ target: "/app/runtime-data" }, { target: "/app/memory" }],
      environment: { ...commonEnv, RUNTIME_STREAM_LOCAL_ONLY: "true" }
    }),
    registry.register({
      service: "dashboard",
      role: "dashboard",
      image: "rafael-ai-agents/dashboard:v1-readonly",
      dockerfile: "infrastructure/docker/dashboard.Dockerfile",
      serviceMapping: "Dashboard Web",
      capabilities: ["dashboard-read", "telemetry-read"],
      mounts: [{ target: "/app/runtime-data" }, { target: "/app/memory" }],
      environment: { ...commonEnv, DASHBOARD_READONLY_MODE: "true" }
    }),
    registry.register({
      service: "unsafe-demo-denied",
      role: "policy-probe",
      image: "rafael-ai-agents/unsafe-probe:blocked",
      dockerfile: "infrastructure/docker/runtime.Dockerfile",
      serviceMapping: "Policy violation probe",
      capabilities: ["policy-test"],
      mounts: [{ target: "/var/run/docker.sock" }],
      environment: { RUNTIME_READONLY_MODE: "false", RUNTIME_SAFE_MODE: "false" },
      privileged: true,
      externalPublic: true,
      status: "unhealthy",
      lastHeartbeatAt: new Date(Date.now() - 120_000).toISOString()
    })
  ];
}

function runRuntimeContainerizationDemo({ rootDir = process.cwd() } = {}) {
  const registry = new RuntimeContainerRegistry();
  const policy = new RuntimeContainerPolicy();
  const health = new RuntimeContainerHealth();
  const audit = new RuntimeContainerAudit({ rootDir });
  const containers = seedContainers(registry);
  const policyResults = containers.map((container) => ({ ...container, policy: policy.evaluate(container) }));
  const healthResults = health.evaluate(policyResults);

  for (const container of policyResults) {
    audit.record({
      type: "container.lifecycle",
      containerId: container.containerId,
      service: container.service,
      status: container.status,
      policyAllowed: container.policy.allowed,
      violations: container.policy.violations
    });
  }
  for (const item of healthResults) {
    audit.record({
      type: "container.health",
      containerId: item.containerId,
      service: item.service,
      status: item.status,
      reason: item.reason,
      restartRecommendation: item.restartRecommendation
    });
  }

  const requiredFiles = [
    "infrastructure/docker/runtime.Dockerfile",
    "infrastructure/docker/worker.Dockerfile",
    "infrastructure/docker/dashboard.Dockerfile",
    "infrastructure/docker/streaming.Dockerfile",
    "infrastructure/docker/gateway.Dockerfile",
    "infrastructure/docker/docker-compose.runtime.yml",
    "infrastructure/docker/docker-compose.observability.yml"
  ];

  const report = {
    containerizationDemoId: `runtime_containerization_demo_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    status: "docker_runtime_containerization_ready",
    readonly: true,
    destructiveActions: false,
    kubernetesDeployment: false,
    dockerExecution: false,
    requiredFiles: requiredFiles.map((file) => ({ file, exists: fileExists(rootDir, file) })),
    containers: policyResults.map((container) => ({
      containerId: container.containerId,
      service: container.service,
      role: container.role,
      image: container.image,
      dockerfile: container.dockerfile,
      serviceMapping: container.serviceMapping,
      capabilities: container.capabilities,
      readonly: container.readonly,
      policy: container.policy
    })),
    compose: {
      runtime: {
        file: "infrastructure/docker/docker-compose.runtime.yml",
        network: "rafael-runtime",
        internalNetwork: true,
        services: ["runtime-core", "workers", "gateway"],
        volumes: ["runtime-data", "runtime-memory"]
      },
      observability: {
        file: "infrastructure/docker/docker-compose.observability.yml",
        network: "rafael-observability",
        internalNetwork: true,
        services: ["streaming", "dashboard"],
        volumes: ["runtime-data", "runtime-memory"]
      }
    },
    policies: {
      allowed: policyResults.filter((container) => container.policy.allowed).length,
      denied: policyResults.filter((container) => !container.policy.allowed).length,
      violations: policyResults.flatMap((container) => container.policy.violations.map((violation) => ({
        containerId: container.containerId,
        service: container.service,
        violation
      })))
    },
    health: {
      containers: healthResults,
      unhealthy: healthResults.filter((item) => item.unhealthy),
      restartRecommendations: healthResults.filter((item) => item.restartRecommendation).map((item) => ({
        containerId: item.containerId,
        service: item.service,
        recommendation: item.restartRecommendation
      }))
    },
    isolationMetadata: {
      privilegedContainersAllowed: false,
      externalPublicExposure: false,
      destructiveMountsAllowed: false,
      dockerSocketMountAllowed: false,
      readonlyRootFilesystem: true,
      secretsPersisted: false,
      cloudNativeReady: true,
      kubernetesFutureReady: true
    },
    integrations: {
      runtimeGateway: readLatestSource(rootDir, "memory/api-gateway"),
      streaming: readLatestSource(rootDir, "memory/streaming"),
      distributedRuntime: readLatestSource(rootDir, "memory/distributed-runtime"),
      distributedQueue: readLatestSource(rootDir, "memory/distributed-queue"),
      replay: readLatestSource(rootDir, "memory/replay"),
      recovery: readLatestSource(rootDir, "memory/self-healing"),
      redisLayer: readLatestSource(rootDir, "memory/redis"),
      telemetry: readLatestSource(rootDir, "memory/telemetry"),
      dashboard: readLatestSource(rootDir, "memory/dashboard-web"),
      multiprocessWorkers: readLatestSource(rootDir, "memory/multiprocess-workers")
    },
    audit: {
      events: audit.events,
      policyViolations: audit.events.filter((event) => Array.isArray(event.violations) && event.violations.length > 0),
      restartRecommendations: audit.events.filter((event) => event.restartRecommendation)
    },
    fallback: {
      safeMode: true,
      jsonFallback: true,
      behavior: "containerization is declarative only; no docker build, run, push or kubernetes deploy is executed"
    },
    risks: [
      "Dockerfiles are readiness artifacts and were not built in V1 validation",
      "compose files are local/internal and do not represent Kubernetes deployment",
      "volume permissions still require hardening when moving to real container runtime",
      "health is metadata-only until a real container runtime is connected"
    ],
    persistence: null
  };
  report.persistence = audit.persist(report);

  console.log(JSON.stringify({
    containerizationDemoId: report.containerizationDemoId,
    status: report.status,
    containers: report.containers.map((container) => ({
      service: container.service,
      role: container.role,
      dockerfile: container.dockerfile,
      policyAllowed: container.policy.allowed,
      violations: container.policy.violations
    })),
    compose: report.compose,
    policies: report.policies,
    health: report.health,
    isolationMetadata: report.isolationMetadata,
    audit: {
      totalEvents: report.audit.events.length,
      policyViolations: report.audit.policyViolations.length,
      restartRecommendations: report.audit.restartRecommendations.length
    },
    integrations: report.integrations,
    fallback: report.fallback,
    persistence: report.persistence
  }, null, 2));
  return report;
}

if (require.main === module) {
  try {
    runRuntimeContainerizationDemo();
  } catch (error) {
    console.error(JSON.stringify({
      status: "runtime_containerization_demo_failed",
      error: error.message,
      fallback: {
        safeMode: true,
        reason: "runtime-containerization-demo-error"
      }
    }, null, 2));
    process.exitCode = 1;
  }
}

module.exports = {
  runRuntimeContainerizationDemo
};
