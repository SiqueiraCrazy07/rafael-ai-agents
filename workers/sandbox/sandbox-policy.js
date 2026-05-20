const path = require("node:path");

const DEFAULT_MAX_PAYLOAD_BYTES = 8192;
const DEFAULT_TIMEOUT_MS = 1000;

function normalizePath(rootDir, inputPath) {
  if (!inputPath) {
    return null;
  }
  return path.resolve(rootDir, inputPath);
}

function isInside(candidate, allowedRoot) {
  const relative = path.relative(allowedRoot, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function jsonByteSize(value) {
  return Buffer.byteLength(JSON.stringify(value || {}), "utf8");
}

class SandboxPolicy {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.maxPayloadBytes = options.maxPayloadBytes || DEFAULT_MAX_PAYLOAD_BYTES;
    this.defaultTimeoutMs = options.defaultTimeoutMs || DEFAULT_TIMEOUT_MS;
    this.maxTimeoutMs = options.maxTimeoutMs || DEFAULT_TIMEOUT_MS;
    this.permittedWriteRoots = (options.permittedWriteRoots || [
      "runtime-data/workers",
      "memory/workers"
    ]).map((relativePath) => path.resolve(this.rootDir, relativePath));
    this.deniedActions = [
      "destructiveActions",
      "network-call",
      "external-call",
      "secret-access",
      "filesystem-write-outside-workers",
      "payload-too-large",
      "missing-timeout"
    ];
  }

  createContextPolicy() {
    return {
      readonlyRequired: true,
      destructiveActionsBlocked: true,
      networkBlocked: true,
      externalCallsBlocked: true,
      secretsBlocked: true,
      maxPayloadBytes: this.maxPayloadBytes,
      timeoutRequired: true,
      maxTimeoutMs: this.maxTimeoutMs,
      permittedPaths: this.permittedWriteRoots,
      deniedActions: this.deniedActions
    };
  }

  evaluateExecutionRequest(request = {}) {
    const allowedActions = [];
    const deniedActions = [];
    const payloadBytes = jsonByteSize(request.payload);

    if (request.readonly !== true) {
      deniedActions.push({
        action: "readonly-required",
        reason: "sandbox requires readonly=true"
      });
    } else {
      allowedActions.push({
        action: "readonly-mode",
        reason: "readonly execution accepted"
      });
    }

    if (request.destructiveActions === true) {
      deniedActions.push({
        action: "destructiveActions",
        reason: "destructive actions are blocked"
      });
    }

    if (!request.timeoutMs) {
      deniedActions.push({
        action: "missing-timeout",
        reason: "timeoutMs is required"
      });
    } else if (request.timeoutMs > this.maxTimeoutMs) {
      deniedActions.push({
        action: "timeout-too-large",
        reason: `timeoutMs must be <= ${this.maxTimeoutMs}`
      });
    } else {
      allowedActions.push({
        action: "timeout",
        timeoutMs: request.timeoutMs
      });
    }

    if (payloadBytes > this.maxPayloadBytes) {
      deniedActions.push({
        action: "payload-too-large",
        payloadBytes,
        maxPayloadBytes: this.maxPayloadBytes
      });
    } else {
      allowedActions.push({
        action: "payload-size",
        payloadBytes,
        maxPayloadBytes: this.maxPayloadBytes
      });
    }

    return {
      allowed: deniedActions.length === 0,
      allowedActions,
      deniedActions,
      policy: this.createContextPolicy()
    };
  }

  evaluateAction(action = {}) {
    if (action.type === "network-call" || action.type === "external-call") {
      return {
        allowed: false,
        action: action.type,
        reason: "network and external calls are blocked in Worker Sandbox V1"
      };
    }

    if (action.type === "secret-access") {
      return {
        allowed: false,
        action: action.type,
        reason: "direct secret access is blocked"
      };
    }

    if (action.type === "destructiveActions") {
      return {
        allowed: false,
        action: action.type,
        reason: "destructive actions are blocked"
      };
    }

    if (action.type === "filesystem-write") {
      const targetPath = normalizePath(this.rootDir, action.path);
      const allowed = targetPath
        ? this.permittedWriteRoots.some((allowedRoot) => isInside(targetPath, allowedRoot))
        : false;
      return {
        allowed,
        action: action.type,
        path: targetPath,
        reason: allowed
          ? "filesystem write target is inside permitted worker paths"
          : "filesystem write target is outside permitted worker paths"
      };
    }

    return {
      allowed: true,
      action: action.type || "unknown-readonly-action",
      reason: "readonly action accepted"
    };
  }
}

module.exports = {
  DEFAULT_MAX_PAYLOAD_BYTES,
  DEFAULT_TIMEOUT_MS,
  SandboxPolicy
};
