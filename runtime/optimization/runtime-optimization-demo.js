const { RuntimeOptimizationCoordinator } = require("./runtime-optimization-coordinator");

function runRuntimeOptimizationDemo() {
  const coordinator = new RuntimeOptimizationCoordinator();
  const report = coordinator.run();
  const persistence = coordinator.persist(report);

  console.log(
    JSON.stringify(
      {
        optimizationId: report.optimizationId,
        status: report.status,
        source: report.source,
        bottlenecks: report.bottlenecks,
        concurrency: report.optimizations.concurrency,
        retry: report.optimizations.retry,
        balancing: report.optimizations.balancing,
        queue: report.optimizations.queue,
        throttling: report.optimizations.throttling,
        recommendations: report.recommendations,
        optimizationGains: report.optimizationGains,
        persistence
      },
      null,
      2
    )
  );
}

runRuntimeOptimizationDemo();
