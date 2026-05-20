const fs = require("node:fs");
const path = require("node:path");

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

class OptimizationEnforcer {
  constructor(rootDir = process.cwd()) {
    this.rootDir = rootDir;
  }

  enforce(readResult) {
    if (!readResult.available) {
      return {
        enforcementId: `optimization_enforcement_${Date.now()}`,
        generatedAt: new Date().toISOString(),
        status: "no_optimization_policy_available",
        decisions: []
      };
    }

    const policy = readResult.policy;
    const decisions = [
      this.applyConcurrency(policy),
      ...this.applyRetry(policy),
      ...this.applyWorkerBalancing(policy),
      ...this.applyQueuePriority(policy),
      this.applyThrottling(policy)
    ].filter(Boolean);

    return {
      enforcementId: `optimization_enforcement_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      status: decisions.length > 0 ? "optimization_enforcement_plan_generated" : "no_decisions_generated",
      mode: "declarative-v1",
      safety: {
        productionChanged: false,
        destructiveActions: false,
        appliesRuntimePlanOnly: true,
        requiresExplicitIntegrationForRealExecution: true
      },
      source: {
        optimizationId: readResult.optimizationId,
        sourcePath: readResult.sourcePath,
        latestQueueSimulation: policy.source.latestQueueSimulation || null,
        latestForecast: policy.source.latestForecast || null,
        latestEnforcement: policy.source.latestEnforcement || null
      },
      summary: {
        concurrencyDecisions: decisions.filter((decision) => decision.type === "concurrency-limit").length,
        retryDecisions: decisions.filter((decision) => decision.type === "retry-strategy").length,
        workerAvoidanceDecisions: decisions.filter((decision) => decision.type === "worker-avoidance").length,
        queuePriorityDecisions: decisions.filter((decision) => decision.type === "queue-priority").length,
        throttlingDecisions: decisions.filter((decision) => decision.type === "throttling-mode").length
      },
      decisions,
      optimizationGains: policy.gains
    };
  }

  applyConcurrency(policy) {
    if (policy.recommendedLimit === null) {
      return null;
    }

    return {
      type: "concurrency-limit",
      status: "planned",
      action: "apply-recommended-concurrency-limit",
      recommendedLimit: policy.recommendedLimit,
      mode: policy.concurrencyMode,
      scope: "runtime",
      safety: "declarative-only"
    };
  }

  applyRetry(policy) {
    const decisions = [];
    if (policy.retryStrategy.defaultStrategy) {
      decisions.push({
        type: "retry-strategy",
        status: "planned",
        action: "apply-default-retry-strategy",
        strategy: policy.retryStrategy.defaultStrategy,
        scope: "runtime",
        safety: "declarative-only"
      });
    }

    for (const strategy of policy.retryStrategy.strategies) {
      decisions.push({
        type: "retry-strategy",
        status: "planned",
        action: "apply-workflow-retry-strategy",
        workflow: strategy.workflow,
        recommendedMaxRetries: strategy.recommendedMaxRetries,
        backoff: strategy.backoff,
        reason: strategy.reason,
        safety: "declarative-only"
      });
    }

    return decisions;
  }

  applyWorkerBalancing(policy) {
    return policy.workerBalancing.recommendedRebalance.map((rebalance) => ({
      type: "worker-avoidance",
      status: "planned",
      action: "avoid-saturated-worker-and-shift-new-work",
      avoidWorker: rebalance.from,
      preferredWorkers: rebalance.to,
      balancingAction: rebalance.action,
      reason: rebalance.reason,
      safety: "declarative-only"
    }));
  }

  applyQueuePriority(policy) {
    return policy.queuePriorityAdjustments
      .filter((adjustment) => adjustment.currentPriority !== adjustment.recommendedPriority)
      .map((adjustment) => ({
        type: "queue-priority",
        status: "planned",
        action: "apply-workflow-priority-adjustment",
        workflow: adjustment.workflow,
        currentPriority: adjustment.currentPriority,
        recommendedPriority: adjustment.recommendedPriority,
        reason: adjustment.reason,
        safety: "declarative-only"
      }));
  }

  applyThrottling(policy) {
    if (!policy.throttlingMode) {
      return null;
    }

    return {
      type: "throttling-mode",
      status: "planned",
      action: "respect-optimized-throttling-mode",
      mode: policy.throttlingMode,
      maxConcurrentExecutions: policy.throttling.maxConcurrentExecutions,
      releaseCondition: policy.throttling.releaseCondition,
      reason: policy.throttling.reason,
      safety: "declarative-only"
    };
  }

  persist(report) {
    const runtimeDir = path.join(this.rootDir, "runtime-data", "optimization-enforcement");
    const memoryDir = path.join(this.rootDir, "memory", "optimization-enforcement");
    ensureDirectory(runtimeDir);
    ensureDirectory(memoryDir);

    const filename = `optimization-enforcement-${timestampForFile()}.json`;
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
  OptimizationEnforcer
};
