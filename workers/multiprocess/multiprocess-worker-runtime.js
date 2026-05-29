const fs = require("node:fs");
const path = require("node:path");
const { WorkerProcessAudit } = require("./worker-process-audit");
const { WorkerProcessHeartbeat } = require("./worker-process-heartbeat");
const { WorkerProcessIsolation } = require("./worker-process-isolation");
const { WorkerProcessLauncher } = require("./worker-process-launcher");
const { WorkerProcessRecovery } = require("./worker-process-recovery");
const { WorkerProcessRegistry } = require("./worker-process-registry");
const { WorkerProcessSupervisor } = require("./worker-process-supervisor");

function readLatestReport(rootDir, relativeDir, idFields = []) {
  const directory = path.join(rootDir, relativeDir);
  if (!fs.existsSync(directory)) {
    return {
      available: false,
      sourcePath: null,
      id: "source-unavailable-safe-fallback",
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

  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(file.sourcePath, "utf8"));
      const id = idFields.map((field) => data[field]).find(Boolean) || data.status || "metadata-readable";
      return {
        available: true,
        sourcePath: file.sourcePath,
        id,
        fallback: null
      };
    } catch (error) {
      // Try the next report; stale or partial JSON should not block the demo.
    }
  }

  return {
    available: false,
    sourcePath: null,
    id: "no-readable-json-safe-fallback",
    fallback: { safeMode: true, reason: "no-readable-json-files" }
  };
}

function waitForProcess({ child, processRecord, heartbeat, registry, timeoutMs }) {
  return new Promise((resolve) => {
    const messages = [];
    const heartbeats = [];
    let result = null;
    let exit = null;
    let settled = false;

    const finish = (reason) => {
      if (settled) {
        return;
      }
      settled = true;
      if (!exit && child.exitCode === null) {
        child.kill();
      }
      const finalStatus = reason === "crashed" || reason === "timeout" || reason === "error"
        ? reason
        : result?.status || reason;
      registry.updateProcess(processRecord.processId, {
        status: finalStatus,
        healthStatus: finalStatus === "completed" ? "healthy" : "unhealthy"
      });
      resolve({ processRecord, messages, heartbeats, result, exit, finishReason: reason });
    };

    const timer = setTimeout(() => finish("timeout"), timeoutMs);
    child.on("message", (message) => {
      messages.push(message);
      if (message.type === "heartbeat") {
        heartbeats.push(heartbeat.record({
          processId: processRecord.processId,
          workerId: processRecord.workerId,
          timestamp: message.timestamp,
          status: "alive",
          metrics: message.metrics
        }));
      }
      if (message.type === "result") {
        result = message;
      }
    });
    child.on("exit", (code, signal) => {
      clearTimeout(timer);
      exit = {
        processId: processRecord.processId,
        workerId: processRecord.workerId,
        code,
        signal,
        timestamp: new Date().toISOString()
      };
      finish(code === 0 ? "exited" : "crashed");
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      exit = {
        processId: processRecord.processId,
        workerId: processRecord.workerId,
        code: 1,
        signal: "error",
        error: error.message,
        timestamp: new Date().toISOString()
      };
      finish("error");
    });
  });
}

class MultiprocessWorkerRuntime {
  constructor({ rootDir = process.cwd() } = {}) {
    this.rootDir = rootDir;
    this.registry = new WorkerProcessRegistry();
    this.isolation = new WorkerProcessIsolation();
    this.launcher = new WorkerProcessLauncher({ timeoutMs: 1200 });
    this.heartbeat = new WorkerProcessHeartbeat({ staleAfterMs: 300 });
    this.supervisor = new WorkerProcessSupervisor();
    this.recovery = new WorkerProcessRecovery();
    this.audit = new WorkerProcessAudit({ rootDir });
  }

  async runDemo() {
    const workers = this.seedWorkers();
    const jobs = this.seedJobs();
    const launchRecords = [];
    const blockedJobs = [];

    for (const job of jobs) {
      const worker = this.selectWorker(workers, job);
      if (!worker) {
        blockedJobs.push({ job, reason: "no-capable-worker" });
        continue;
      }
      const context = this.isolation.buildContext(worker, job);
      if (!context.allowed) {
        blockedJobs.push({ job, workerId: worker.workerId, reason: "isolation-policy-violation", violations: context.violations });
        continue;
      }
      const launched = this.launcher.launch({ worker, job, context });
      this.registry.attachProcess(worker.workerId, launched.processRecord);
      launchRecords.push({ ...launched, context, job });
    }

    const settled = await Promise.all(launchRecords.map((record) => waitForProcess({
      child: record.child,
      processRecord: record.processRecord,
      heartbeat: this.heartbeat,
      registry: this.registry,
      timeoutMs: record.job.simulateFreeze ? 450 : 1200
    })));

    const processes = this.registry.listProcesses();
    const staleProbe = {
      processId: "mp_process_stale_probe",
      workerId: "mp-worker-stale",
      workflowId: "stale-heartbeat-workflow",
      executionId: "stale-heartbeat-execution",
      correlationId: "stale-heartbeat-correlation",
      status: "running",
      healthStatus: "unknown",
      safetyMode: "readonly-safe-stale-probe"
    };
    processes.push(staleProbe);
    this.heartbeat.record({
      processId: staleProbe.processId,
      workerId: staleProbe.workerId,
      timestamp: new Date(Date.now() - 5000).toISOString(),
      metrics: { phase: "stale-probe" }
    });

    const heartbeatStatus = this.heartbeat.evaluate(processes);
    const results = settled.map((item) => item.result).filter(Boolean);
    const exits = settled.map((item) => item.exit).filter(Boolean);
    const supervisorChecks = this.supervisor.supervise({ processes, heartbeatStatus, results, exits });
    const recovery = this.recovery.plan(supervisorChecks);
    const integrations = this.buildIntegrations();

    const report = {
      multiprocessWorkerDemoId: `multiprocess_workers_demo_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      status: "multiprocess_worker_runtime_ready",
      readonly: true,
      destructiveActions: false,
      localSubprocessOnly: true,
      containers: false,
      workers: this.registry.listWorkers(),
      subprocessWorkers: processes,
      jobs: jobs.map((job) => ({
        jobId: job.jobId,
        workflowId: job.workflowId,
        requiredCapability: job.requiredCapability,
        readonly: job.readonly !== false
      })),
      blockedJobs,
      executionMetadata: settled.map((item) => ({
        processId: item.processRecord.processId,
        workerId: item.processRecord.workerId,
        workflowId: item.processRecord.workflowId,
        executionId: item.processRecord.executionId,
        correlationId: item.processRecord.correlationId,
        result: item.result,
        exit: item.exit,
        finishReason: item.finishReason
      })),
      heartbeats: heartbeatStatus,
      supervisorChecks,
      staleDetection: heartbeatStatus.filter((item) => item.stale),
      recoveryRecommendations: recovery.recommendations,
      quarantineMetadata: recovery.quarantineMetadata,
      workerIsolation: {
        maxPayloadBytes: this.isolation.maxPayloadBytes,
        deniedActions: [...this.isolation.blockedCommands],
        blockedJobs: blockedJobs.length,
        safetyMode: "readonly-safe-multiprocess-isolation-summary"
      },
      integrations,
      fallback: {
        safeMode: true,
        jsonFallback: true,
        behavior: "subprocesses run local readonly metadata execution only; failures generate recommendations, not real recovery",
        blockedDestructiveJobs: blockedJobs.filter((item) => item.reason === "isolation-policy-violation").length
      },
      persistence: null
    };
    report.persistence = this.audit.persist(report);
    return report;
  }

  seedWorkers() {
    return [
      this.registry.registerWorker({
        workerId: "mp-worker-runtime-read-1",
        nodeId: "runtime-node-a",
        capabilities: ["runtime-read", "queue-read", "telemetry-read"]
      }),
      this.registry.registerWorker({
        workerId: "mp-worker-dashboard-read-1",
        nodeId: "runtime-node-b",
        capabilities: ["dashboard-read", "runtime-read"]
      }),
      this.registry.registerWorker({
        workerId: "mp-worker-recovery-read-1",
        nodeId: "runtime-node-b",
        capabilities: ["recovery-read", "replay-read", "runtime-read"]
      })
    ];
  }

  seedJobs() {
    return [
      {
        jobId: "mp-job-runtime-observe",
        workflowId: "multiprocess-runtime-observe",
        requiredCapability: "runtime-read",
        payload: { source: "distributed-runtime" },
        readonly: true
      },
      {
        jobId: "mp-job-crash-probe",
        workflowId: "multiprocess-crash-probe",
        requiredCapability: "recovery-read",
        payload: { source: "self-healing", simulate: "crash" },
        simulateCrash: true,
        readonly: true
      },
      {
        jobId: "mp-job-freeze-probe",
        workflowId: "multiprocess-freeze-probe",
        requiredCapability: "telemetry-read",
        payload: { source: "streaming", simulate: "freeze" },
        simulateFreeze: true,
        readonly: true
      },
      {
        jobId: "mp-job-destructive-blocked",
        workflowId: "multiprocess-destructive-blocked",
        requiredCapability: "runtime-read",
        command: "delete-file",
        payload: { target: "blocked" },
        readonly: true
      }
    ];
  }

  selectWorker(workers, job) {
    return workers.find((worker) =>
      worker.enabled &&
      worker.readonly &&
      worker.healthStatus === "healthy" &&
      worker.capabilities.includes(job.requiredCapability)
    );
  }

  buildIntegrations() {
    const distributed = readLatestReport(this.rootDir, "memory/distributed-runtime", ["distributedRuntimeDemoId"]);
    const distributedQueue = readLatestReport(this.rootDir, "memory/distributed-queue", ["distributedQueueReportId"]);
    const replay = readLatestReport(this.rootDir, "memory/replay", ["replayDemoId"]);
    const selfHealing = readLatestReport(this.rootDir, "memory/self-healing", ["runtimeRecoveryDemoId", "recoveryDemoId"]);
    const transport = readLatestReport(this.rootDir, "memory/transport", ["transportReportId"]);
    const telemetry = readLatestReport(this.rootDir, "memory/telemetry", ["telemetryReportId"]);
    const scheduler = readLatestReport(this.rootDir, "memory/worker-scheduler", ["workerSchedulerReportId"]);
    return {
      distributedRuntime: distributed.id,
      distributedQueue: distributedQueue.id,
      replay: replay.id,
      selfHealing: selfHealing.id,
      streaming: "memory/multiprocess-workers is streaming-readable",
      transport: transport.id,
      telemetry: telemetry.id,
      dashboard: "multiprocess report is dashboard-readable",
      scheduler: scheduler.id,
      sources: {
        distributedRuntime: distributed,
        distributedQueue,
        replay,
        selfHealing,
        transport,
        telemetry,
        scheduler
      }
    };
  }
}

module.exports = {
  MultiprocessWorkerRuntime
};
