class WorkerSaturationPredictor {
  predict(memory) {
    const byWorker = new Map();

    for (const report of memory.queueReports) {
      for (const worker of report.data.workers || []) {
        const current = byWorker.get(worker.workerId) || {
          workerId: worker.workerId,
          samples: 0,
          capacity: worker.capacity || 1,
          activeSamples: 0,
          assignedExecutions: 0,
          failedExecutions: 0,
          capabilities: worker.capabilities || []
        };
        current.samples += 1;
        current.capacity = Math.max(current.capacity, worker.capacity || 1);
        current.capabilities = [...new Set([...current.capabilities, ...(worker.capabilities || [])])];
        if (worker.status === "active") {
          current.activeSamples += 1;
        }
        byWorker.set(worker.workerId, current);
      }

      for (const result of report.data.results || []) {
        if (!result.workerId) {
          continue;
        }
        const current = byWorker.get(result.workerId) || {
          workerId: result.workerId,
          samples: 0,
          capacity: 1,
          activeSamples: 0,
          assignedExecutions: 0,
          failedExecutions: 0,
          capabilities: []
        };
        current.assignedExecutions += 1;
        if (result.status === "failed") {
          current.failedExecutions += 1;
        }
        byWorker.set(result.workerId, current);
      }
    }

    for (const recovery of memory.runtimeRecoveries) {
      for (const worker of recovery.data.staleWorkers || []) {
        const current = byWorker.get(worker.workerId) || {
          workerId: worker.workerId,
          samples: 0,
          capacity: worker.capacity || 1,
          activeSamples: 0,
          assignedExecutions: 0,
          failedExecutions: 0,
          capabilities: worker.capabilities || []
        };
        current.staleSignals = (current.staleSignals || 0) + 1;
        byWorker.set(worker.workerId, current);
      }
    }

    return [...byWorker.values()]
      .map((worker) => {
        const loadRatio = worker.assignedExecutions / Math.max(1, worker.capacity * Math.max(1, worker.samples));
        const saturationScore = Math.min(
          100,
          Math.round(loadRatio * 35 + worker.failedExecutions * 15 + (worker.staleSignals || 0) * 30)
        );

        return {
          ...worker,
          loadRatio: Number(loadRatio.toFixed(2)),
          saturationScore,
          forecast:
            saturationScore >= 80 ? "critical" : saturationScore >= 60 ? "high" : saturationScore >= 35 ? "watch" : "normal"
        };
      })
      .sort((left, right) => right.saturationScore - left.saturationScore);
  }
}

module.exports = {
  WorkerSaturationPredictor
};
