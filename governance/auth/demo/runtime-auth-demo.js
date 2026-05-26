const fs = require("node:fs");
const path = require("node:path");
const { RuntimeAuthAudit } = require("../runtime-auth-audit");
const { RuntimeAuthManager } = require("../runtime-auth-manager");
const { RuntimePermissionRegistry } = require("../runtime-permission-registry");
const { listRolePolicies } = require("../runtime-role-policies");

function readLatestJson(rootDir, relativeDir) {
  const directory = path.join(rootDir, relativeDir);
  if (!fs.existsSync(directory)) {
    return {
      available: false,
      sourcePath: null,
      reportId: null,
      fallback: { safeMode: true, reason: "directory-unavailable" }
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
      available: false,
      sourcePath: null,
      reportId: null,
      fallback: { safeMode: true, reason: "no-json-reports" }
    };
  }
  try {
    const data = JSON.parse(fs.readFileSync(files[0].sourcePath, "utf8"));
    return {
      available: true,
      sourcePath: files[0].sourcePath,
      reportId: data.streamingDemoId || data.replayDemoId || data.runtimeRecoveryDemoId || data.distributedRuntimeDemoId || data.distributedQueueReportId || data.transportReportId || data.telemetryReportId || data.dashboardWebDemoId || data.status || "runtime-report",
      fallback: null
    };
  } catch (error) {
    return {
      available: false,
      sourcePath: files[0].sourcePath,
      reportId: null,
      fallback: { safeMode: true, reason: "latest-json-invalid", error: error.message }
    };
  }
}

async function runRuntimeAuthDemo({ rootDir = process.cwd(), silent = false } = {}) {
  const audit = new RuntimeAuthAudit({ rootDir });
  const authManager = new RuntimeAuthManager({ audit });
  const permissions = new RuntimePermissionRegistry().listPermissions();

  const identities = [
    { identityId: "runtime-admin-local", role: "admin", tenantId: "tenant-platform" },
    { identityId: "runtime-operator-local", role: "operator", tenantId: "tenant-platform" },
    { identityId: "runtime-observer-local", role: "observer", tenantId: "tenant-platform" },
    { identityId: "runtime-auditor-local", role: "auditor", tenantId: "tenant-platform" },
    { identityId: "runtime-replay-local", role: "replay-operator", tenantId: "tenant-platform" },
    { identityId: "runtime-manager-local", role: "runtime-manager", tenantId: "tenant-platform" }
  ];

  const authentications = identities.map((identity) => authManager.authenticate({
    ...identity,
    project: "platform",
    runtimeNodeId: "local-runtime-node",
    scopes: ["readonly-runtime"]
  }));

  const tokenByRole = Object.fromEntries(authentications.map((auth) => [auth.identity.role, auth.token.token]));
  const authorizationChecks = [
    { label: "admin-stream-admin", token: tokenByRole.admin, permission: "stream:admin" },
    { label: "operator-recovery-plan", token: tokenByRole.operator, permission: "recovery:plan" },
    { label: "observer-dashboard", token: tokenByRole.observer, permission: "dashboard:access" },
    { label: "auditor-replication", token: tokenByRole.auditor, permission: "replication:visibility" },
    { label: "replay-operator-replay", token: tokenByRole["replay-operator"], permission: "replay:read" },
    { label: "runtime-manager-worker-read", token: tokenByRole["runtime-manager"], permission: "worker:read" },
    { label: "observer-recovery-denied", token: tokenByRole.observer, permission: "recovery:plan" },
    { label: "operator-stream-admin-denied", token: tokenByRole.operator, permission: "stream:admin" },
    { label: "runtime-manager-worker-execute-denied", token: tokenByRole["runtime-manager"], permission: "worker:read", operation: "worker:execute" },
    { label: "admin-cross-tenant-denied", token: tokenByRole.admin, permission: "dashboard:access", requestedTenantId: "tenant-other" },
    { label: "invalid-token-denied", token: "invalid-local-token", permission: "dashboard:access" }
  ];

  const authorizationResults = authorizationChecks.map((check) => ({
    label: check.label,
    ...authManager.authorize(check)
  }));

  const sessions = authManager.listSessions();
  const deniedOperations = authorizationResults
    .filter((result) => !result.allowed)
    .map((result) => ({
      label: result.label,
      permission: result.permission,
      operation: result.operation,
      reason: result.reason,
      escalationRecommendation: result.escalationRecommendation
    }));

  const integrationSources = {
    streaming: readLatestJson(rootDir, "memory/streaming"),
    replay: readLatestJson(rootDir, "memory/replay"),
    recovery: readLatestJson(rootDir, "memory/self-healing"),
    distributedRuntime: readLatestJson(rootDir, "memory/distributed-runtime"),
    distributedQueue: readLatestJson(rootDir, "memory/distributed-queue"),
    transport: readLatestJson(rootDir, "memory/transport"),
    telemetry: readLatestJson(rootDir, "memory/telemetry"),
    dashboard: readLatestJson(rootDir, "memory/dashboard-web")
  };

  const report = {
    authDemoId: `runtime_auth_demo_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    status: "enterprise_auth_rbac_runtime_ready",
    readonly: true,
    destructiveActions: false,
    externalAuth: false,
    oauthEnabled: false,
    jwtEnabled: false,
    localTokenAuth: true,
    roles: listRolePolicies(),
    permissions,
    authentications: authentications.map((auth) => ({
      identity: auth.identity,
      token: {
        tokenType: auth.token.tokenType,
        issuedAt: auth.token.issuedAt,
        expiresAt: auth.token.expiresAt,
        externalProvider: auth.token.externalProvider
      },
      sessionId: auth.session.sessionId,
      tenantScope: auth.tenantScope
    })),
    authorizationResults,
    sessions,
    deniedOperations,
    authAudit: {
      events: audit.events,
      deniedOperations: audit.deniedOperations(),
      escalationRecommendations: audit.deniedOperations().map((event) => event.escalationRecommendation || "review-denied-operation")
    },
    tenantMetadata: authentications.map((auth) => auth.tenantScope),
    integrations: {
      streaming: {
        source: integrationSources.streaming,
        protectedPermissions: ["stream:subscribe", "stream:admin"]
      },
      replay: {
        source: integrationSources.replay,
        protectedPermission: "replay:read",
        executeReplayDenied: true
      },
      recovery: {
        source: integrationSources.recovery,
        protectedPermission: "recovery:plan",
        executeRecoveryDenied: true
      },
      selfHealing: "recovery plans remain supervised and readonly-safe",
      distributedRuntime: {
        source: integrationSources.distributedRuntime,
        protectedPermissions: ["worker:read", "transport:visibility"]
      },
      distributedQueue: {
        source: integrationSources.distributedQueue,
        protectedPermission: "queue:read"
      },
      dashboard: {
        source: integrationSources.dashboard,
        protectedPermission: "dashboard:access",
        readonlyAccessOnly: true
      },
      transport: {
        source: integrationSources.transport,
        protectedPermission: "transport:visibility"
      },
      telemetry: {
        source: integrationSources.telemetry,
        protectedByDashboardAccess: true
      }
    },
    fallback: {
      safeMode: true,
      denyByDefault: true,
      invalidTokenBehavior: "deny-readonly",
      unknownPermissionBehavior: "deny-readonly",
      expiredSessionBehavior: "require-local-reauthentication",
      jsonFallback: true
    },
    risks: [
      "Auth is local and simulated in V1",
      "OAuth and real JWT verification are intentionally out of scope",
      "RBAC protects metadata and plan access; runtime mutation remains blocked",
      "Future external identity providers require secret handling and governance review"
    ],
    persistence: null
  };
  report.persistence = audit.persist(report);

  if (!silent) {
    console.log(JSON.stringify({
    authDemoId: report.authDemoId,
    status: report.status,
    roles: report.roles.map((role) => ({
      role: role.role,
      permissions: role.permissions,
      deniedOperations: role.deniedOperations
    })),
    permissions: report.permissions.map((permission) => permission.permission),
    sessions: report.sessions.map((session) => ({
      sessionId: session.sessionId,
      role: session.role,
      status: session.status,
      stale: session.stale,
      expired: session.expired
    })),
    allowedOperations: report.authorizationResults
      .filter((result) => result.allowed)
      .map((result) => ({ label: result.label, permission: result.permission, reason: result.reason })),
    deniedOperations: report.deniedOperations,
    authAudit: {
      totalEvents: report.authAudit.events.length,
      deniedEvents: report.authAudit.deniedOperations.length,
      escalationRecommendations: report.authAudit.escalationRecommendations
    },
    tenantMetadata: report.tenantMetadata,
    integrations: report.integrations,
    fallback: report.fallback,
    persistence: report.persistence
    }, null, 2));
  }
  return report;
}

if (require.main === module) {
  runRuntimeAuthDemo().catch((error) => {
    console.error(JSON.stringify({
      status: "runtime_auth_demo_failed",
      error: error.message,
      fallback: {
        safeMode: true,
        reason: "runtime-auth-demo-error"
      }
    }, null, 2));
    process.exitCode = 1;
  });
}

module.exports = {
  runRuntimeAuthDemo
};
