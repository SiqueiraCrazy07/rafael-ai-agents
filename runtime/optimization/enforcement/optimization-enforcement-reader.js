const fs = require("node:fs");
const path = require("node:path");

function readJsonFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const fullPath = path.join(directory, file);
      return {
        path: fullPath,
        mtimeMs: fs.statSync(fullPath).mtimeMs,
        data: JSON.parse(fs.readFileSync(fullPath, "utf8"))
      };
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs);
}

class OptimizationEnforcementReader {
  constructor(rootDir = process.cwd()) {
    this.rootDir = rootDir;
    this.enforcementDir = path.join(rootDir, "memory", "optimization-enforcement");
  }

  readLatest() {
    const latest = readJsonFiles(this.enforcementDir)[0] || null;
    if (!latest) {
      return {
        available: false,
        sourcePath: null,
        enforcementId: null,
        workersToAvoid: [],
        agentIdsToAvoid: [],
        maxConcurrentExecutions: null,
        throttlingMode: null,
        gatedPriorities: [],
        retryStrategy: {
          defaultStrategy: null,
          workflows: {}
        }
      };
    }

    const decisions = latest.data.decisions || [];
    const workersToAvoid = [...new Set(decisions
      .filter((decision) => decision.type === "worker-avoidance")
      .map((decision) => decision.avoidWorker)
      .filter(Boolean))];
    const gatedPriorities = decisions
      .filter((decision) => decision.type === "queue-priority")
      .map((decision) => ({
        workflow: decision.workflow,
        currentPriority: decision.currentPriority,
        recommendedPriority: decision.recommendedPriority,
        reason: decision.reason
      }));
    const concurrency = decisions.find((decision) => decision.type === "concurrency-limit");
    const throttling = decisions.find((decision) => decision.type === "throttling-mode");
    const retryDecisions = decisions.filter((decision) => decision.type === "retry-strategy");
    const defaultRetry = retryDecisions.find((decision) => decision.action === "apply-default-retry-strategy");
    const workflowRetries = Object.fromEntries(
      retryDecisions
        .filter((decision) => decision.action === "apply-workflow-retry-strategy")
        .map((decision) => [
          decision.workflow,
          {
            recommendedMaxRetries: decision.recommendedMaxRetries,
            backoff: decision.backoff,
            reason: decision.reason
          }
        ])
    );

    return {
      available: true,
      sourcePath: latest.path,
      enforcementId: latest.data.enforcementId,
      workersToAvoid,
      agentIdsToAvoid: workersToAvoid.map((workerId) => this.mapWorkerToAgent(workerId)).filter(Boolean),
      maxConcurrentExecutions:
        concurrency?.recommendedLimit ?? throttling?.maxConcurrentExecutions ?? null,
      throttlingMode: throttling?.mode || null,
      gatedPriorities,
      retryStrategy: {
        defaultStrategy: defaultRetry?.strategy || null,
        workflows: workflowRetries
      },
      raw: latest.data
    };
  }

  mapWorkerToAgent(workerId) {
    const map = {
      "worker-site-frontend-1": "site-frontend-agent",
      "worker-site-backend-1": "site-backend-agent",
      "worker-qa-1": "site-qa-agent"
    };

    return map[workerId] || null;
  }
}

module.exports = {
  OptimizationEnforcementReader
};
