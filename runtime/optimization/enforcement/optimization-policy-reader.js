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

class OptimizationPolicyReader {
  constructor(rootDir = process.cwd()) {
    this.rootDir = rootDir;
    this.optimizationDir = path.join(rootDir, "memory", "optimization");
  }

  readLatest() {
    const latest = readJsonFiles(this.optimizationDir)[0] || null;
    if (!latest) {
      return {
        sourcePath: null,
        optimizationId: null,
        available: false,
        policy: null
      };
    }

    const report = latest.data;
    const optimizations = report.optimizations || {};

    return {
      sourcePath: latest.path,
      optimizationId: report.optimizationId,
      available: true,
      policy: {
        recommendedLimit: optimizations.concurrency?.recommendedLimit ?? null,
        concurrencyMode: optimizations.concurrency?.mode || null,
        retryStrategy: {
          defaultStrategy: optimizations.retry?.defaultStrategy || null,
          strategies: optimizations.retry?.strategies || []
        },
        workerBalancing: {
          saturatedWorkers: optimizations.balancing?.saturatedWorkers || [],
          recommendedRebalance: optimizations.balancing?.recommendedRebalance || []
        },
        queuePriorityAdjustments: optimizations.queue?.priorityAdjustments || [],
        queueBottlenecks: optimizations.queue?.bottlenecks || [],
        throttlingMode: optimizations.throttling?.recommendedMode || null,
        throttling: {
          maxConcurrentExecutions: optimizations.throttling?.maxConcurrentExecutions ?? null,
          releaseCondition: optimizations.throttling?.releaseCondition || null,
          reason: optimizations.throttling?.reason || null
        },
        gains: report.optimizationGains || null,
        source: report.source || {}
      }
    };
  }
}

module.exports = {
  OptimizationPolicyReader
};
