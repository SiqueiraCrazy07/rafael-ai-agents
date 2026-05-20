const fs = require("node:fs");
const path = require("node:path");

const { WorkerLoadBalancer } = require("./balancing/worker-load-balancer");
const { OptimizationMemoryLoader } = require("./optimization-memory-loader");
const { OptimizationRecommendationEngine } = require("./optimization-recommendation-engine");
const { QueueOptimizationEngine } = require("./queue/queue-optimization-engine");
const { AdaptiveRetryOptimizer } = require("./retries/adaptive-retry-optimizer");
const { AdaptiveThrottlingOptimizer } = require("./throttling/adaptive-throttling-optimizer");
const { RuntimeSelfOptimizationLoop } = require("./loops/runtime-self-optimization-loop");
const { DynamicConcurrencyOptimizer } = require("./workers/dynamic-concurrency-optimizer");

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

function latest(items) {
  return items.at(-1)?.data || null;
}

class RuntimeOptimizationCoordinator {
  constructor(rootDir = process.cwd()) {
    this.rootDir = rootDir;
    this.loader = new OptimizationMemoryLoader(rootDir);
  }

  run() {
    const memory = this.loader.load();
    const latestQueue = latest(memory.queueReports);
    const latestPredictive = latest(memory.predictiveReports);
    const latestProactive = latest(memory.proactiveReports);

    const concurrency = new DynamicConcurrencyOptimizer().optimize({
      latestQueue,
      latestPredictive,
      latestProactive
    });
    const retry = new AdaptiveRetryOptimizer().optimize({ latestQueue, latestPredictive });
    const balancing = new WorkerLoadBalancer().optimize({ latestQueue, latestPredictive });
    const queue = new QueueOptimizationEngine().optimize({ latestQueue, latestPredictive });
    const throttling = new AdaptiveThrottlingOptimizer().optimize({
      latestPredictive,
      latestProactive
    });
    const loop = new RuntimeSelfOptimizationLoop().build({
      concurrency,
      retry,
      balancing,
      queue,
      throttling
    });
    const recommendations = new OptimizationRecommendationEngine().generate({
      concurrency,
      retry,
      balancing,
      queue,
      throttling,
      latestPredictive
    });
    const gains = this.calculateGains({
      latestQueue,
      latestPredictive,
      concurrency,
      balancing,
      queue,
      throttling
    });

    return {
      optimizationId: `optimization_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      status: "optimization_plan_generated",
      memoryLoaded: {
        queueReports: memory.queueReports.length,
        predictiveReports: memory.predictiveReports.length,
        proactiveReports: memory.proactiveReports.length,
        runtimeRecoveries: memory.runtimeRecoveries.length,
        policies: memory.policies.length,
        healthReports: memory.healthReports.length
      },
      bottlenecks: this.detectBottlenecks({ latestQueue, latestPredictive, latestProactive }),
      optimizations: {
        concurrency,
        retry,
        balancing,
        queue,
        throttling
      },
      selfOptimizationLoop: loop,
      recommendations,
      optimizationGains: gains,
      source: {
        latestQueueSimulation: latestQueue?.simulationId || null,
        latestForecast: latestPredictive?.forecastId || null,
        latestEnforcement: latestProactive?.enforcementId || null
      }
    };
  }

  calculateGains({ latestQueue, latestPredictive, concurrency, balancing, queue, throttling }) {
    const failed = latestQueue?.metrics?.failed || 0;
    const blocked = latestQueue?.metrics?.blocked || 0;
    const retryQueued = latestQueue?.metrics?.retryQueued || 0;
    const saturatedWorkers = latestPredictive?.saturatedWorkers?.length || 0;
    const bottlenecks = queue.bottlenecks.length;

    const riskReduction = Math.min(35, saturatedWorkers * 7 + bottlenecks * 5 + (throttling.recommendedMode === "strict-conservative" ? 10 : 0));
    const retryReduction = retryQueued > 0 ? 20 : 5;
    const duplicateAvoidance = 15;
    const stabilityGain = Math.min(40, failed * 10 + blocked * 5 + riskReduction / 2);

    return {
      estimatedRiskReductionPoints: Math.round(riskReduction),
      estimatedRetryReductionPercent: retryReduction,
      estimatedDuplicateAvoidancePercent: duplicateAvoidance,
      estimatedStabilityGainPoints: Math.round(stabilityGain),
      confidence:
        latestPredictive?.memoryLoaded?.queueReports >= 3 && latestPredictive?.memoryLoaded?.runtimeRecoveries >= 1
          ? "medium"
          : "low"
    };
  }

  detectBottlenecks({ latestQueue, latestPredictive, latestProactive }) {
    const bottlenecks = [];
    if ((latestQueue?.metrics?.failed || 0) > 0) {
      bottlenecks.push({
        type: "queue-failures",
        severity: "medium",
        evidence: `failed=${latestQueue.metrics.failed}`
      });
    }
    if ((latestQueue?.metrics?.blocked || 0) > 0) {
      bottlenecks.push({
        type: "blocked-workflows",
        severity: "high",
        evidence: `blocked=${latestQueue.metrics.blocked}`
      });
    }
    for (const worker of latestPredictive?.saturatedWorkers || []) {
      bottlenecks.push({
        type: "worker-saturation",
        severity: worker.forecast === "critical" ? "high" : "medium",
        evidence: `${worker.workerId}:${worker.saturationScore}`
      });
    }
    if (latestProactive?.policy?.enforcementLevel === "strict") {
      bottlenecks.push({
        type: "strict-enforcement",
        severity: "high",
        evidence: "proactive enforcement level is strict"
      });
    }
    return bottlenecks;
  }

  persist(report) {
    const runtimeDir = path.join(this.rootDir, "runtime-data", "optimization");
    const memoryDir = path.join(this.rootDir, "memory", "optimization");
    ensureDirectory(runtimeDir);
    ensureDirectory(memoryDir);

    const filename = `runtime-optimization-${timestampForFile()}.json`;
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
  RuntimeOptimizationCoordinator
};
