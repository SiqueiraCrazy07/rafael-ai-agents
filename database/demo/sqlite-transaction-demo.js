const { SQLiteAdapter } = require("../adapters/sqlite-adapter");
const { FilesystemDbAdapter } = require("../adapters/filesystem-db-adapter");
const { TransactionManager } = require("../adapters/transaction-manager");
const { DatabaseMigrationManager } = require("../adapters/database-migration-manager");
const { DatabaseCheckpointManager } = require("../adapters/database-checkpoint-manager");
const { DatabaseRollbackManager } = require("../adapters/database-rollback-manager");
const { DatabaseHealthMonitor } = require("../adapters/database-health-monitor");
const { createRepositories } = require("../repositories/repository-factory");
const { mirrorAll } = require("../repositories/mirror-service");

function buildAdapter() {
  const adapter = new SQLiteAdapter({
    readonlySafe: true
  });
  const initialization = adapter.initialize();
  return { adapter, initialization };
}

async function runSqliteDemo() {
  const { adapter, initialization } = buildAdapter();
  const filesystemAdapter = new FilesystemDbAdapter();
  const filesystemHealth = filesystemAdapter.health();
  const migrationManager = new DatabaseMigrationManager(adapter);
  const checkpointManager = new DatabaseCheckpointManager(adapter);
  const rollbackManager = new DatabaseRollbackManager(adapter);
  const healthMonitor = new DatabaseHealthMonitor(adapter);

  const migrations = migrationManager.applyMigrations();
  const repositories = createRepositories(adapter);
  const mirror = initialization.available
    ? mirrorAll(repositories, { limit: 5 })
    : {
        status: "mirror-fallback",
        collections: [],
        fallback: initialization.fallback
      };
  const demoRecord = initialization.available
    ? adapter.upsert("runtime_telemetry", {
        telemetryReportId: `sqlite_demo_telemetry_${Date.now()}`,
        generatedAt: new Date().toISOString(),
        source: "sqlite-transaction-demo",
        readonly: true,
        destructiveActions: false,
        integrations: [
          "API",
          "Workers",
          "Scheduler",
          "Autonomous Orchestrator",
          "Dashboard",
          "Telemetry"
        ]
      })
    : {
        ok: false,
        fallback: initialization.fallback
      };
  const checkpoint = initialization.available
    ? checkpointManager.createCheckpoint("sqlite-demo-post-mirror-checkpoint")
    : {
        ok: false,
        fallback: initialization.fallback
      };
  const rollbackPlan = rollbackManager.createRollbackPlan({
    checkpointId: checkpoint.checkpointId || null,
    databasePath: adapter.databasePath
  }, "sqlite-demo-declarative-rollback");
  const rollbackAudit = initialization.available
    ? rollbackManager.recordRollback(rollbackPlan, "planned")
    : {
        ok: false,
        fallback: initialization.fallback
      };
  const health = healthMonitor.check();

  const report = {
    sqliteDemoId: `sqlite_demo_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    status: initialization.available && health.status === "healthy"
      ? "sqlite_adapter_ready"
      : "sqlite_adapter_attention",
    readonly: true,
    destructiveActions: false,
    strategy: {
      nativeSqlite: initialization.nativeSqlite === true,
      windowsCompatible: true,
      readonlySafeDefault: true,
      filesystemDbPreserved: true,
      mirrorMode: true,
      jsonFallbackPreserved: true
    },
    initialization,
    filesystemCompatibility: filesystemHealth,
    migrations,
    mirror,
    demoRecord,
    checkpoint,
    rollback: {
      plan: rollbackPlan,
      audit: rollbackAudit
    },
    health,
    integrations: {
      api: "database-read remains optional and fallback-capable",
      workers: "worker reports can be mirrored into sqlite records",
      scheduler: "scheduler reports can be mirrored/read as telemetry",
      autonomousOrchestrator: "autonomous audit remains append-only and mirror-compatible",
      dashboard: "dashboard continues through API/telemetry fallback",
      telemetry: "database reports continue in memory/database"
    },
    fallback: {
      safeMode: true,
      behavior: "sqlite adapter is additive; filesystem-db and JSON fallback remain available"
    },
    persistence: null
  };
  report.persistence = adapter.persistReport("sqlite-demo", report);
  return report;
}

async function runTransactionDemo() {
  const { adapter, initialization } = buildAdapter();
  const transactionManager = new TransactionManager(adapter, { timeoutMs: 500 });
  const healthMonitor = new DatabaseHealthMonitor(adapter);

  const commitResult = initialization.available
    ? await transactionManager.runInTransaction(() => {
        const record = adapter.upsert("events", {
          eventId: `sqlite_tx_commit_${Date.now()}`,
          type: "transaction-demo-commit",
          source: "sqlite-transaction-demo",
          timestamp: new Date().toISOString(),
          workflowId: "sqlite-transaction-demo",
          correlationId: "sqlite-transaction-demo",
          payload: {
            committed: true
          }
        });
        return { record };
      }, {
        transactionId: `tx_commit_${Date.now()}`,
        reason: "sqlite transaction demo commit"
      })
    : {
        ok: false,
        fallback: initialization.fallback
      };

  const rollbackResult = initialization.available
    ? await transactionManager.runInTransaction(() => {
        adapter.upsert("events", {
          eventId: `sqlite_tx_rollback_${Date.now()}`,
          type: "transaction-demo-rollback",
          source: "sqlite-transaction-demo",
          timestamp: new Date().toISOString(),
          workflowId: "sqlite-transaction-demo",
          correlationId: "sqlite-transaction-demo",
          payload: {
            shouldRollback: true
          }
        });
        throw new Error("intentional rollback demo failure");
      }, {
        transactionId: `tx_rollback_${Date.now()}`,
        reason: "sqlite transaction demo rollback"
      })
    : {
        ok: false,
        fallback: initialization.fallback
      };

  const timeoutResult = initialization.available
    ? await transactionManager.runInTransaction(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return { delayed: true };
      }, {
        transactionId: `tx_timeout_${Date.now()}`,
        timeoutMs: 1,
        reason: "sqlite transaction demo timeout"
      })
    : {
        ok: false,
        fallback: initialization.fallback
      };

  const health = healthMonitor.check();
  const listedEvents = initialization.available
    ? adapter.list("events", { limit: 10 })
    : {
        available: false,
        records: [],
        fallback: initialization.fallback
      };

  const report = {
    transactionDemoId: `sqlite_transaction_demo_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    status: initialization.available && commitResult.ok && !rollbackResult.ok && !timeoutResult.ok
      ? "sqlite_transactions_ready"
      : "sqlite_transactions_attention",
    readonly: true,
    destructiveActions: false,
    initialization,
    transactionStrategy: {
      beginTransaction: true,
      commit: true,
      rollback: true,
      timeout: true,
      deadlockSafeFallback: true
    },
    commitResult,
    rollbackResult,
    timeoutResult,
    listedEvents: {
      available: listedEvents.available,
      total: listedEvents.total,
      sampleCount: listedEvents.records.length,
      fallback: listedEvents.fallback
    },
    health,
    fallback: {
      safeMode: true,
      behavior: "failed or timed-out transactions rollback and return safe reports"
    },
    persistence: null
  };
  report.persistence = adapter.persistReport("sqlite-transaction-demo", report);
  return report;
}

async function main() {
  const mode = process.argv.includes("--transactions") ? "transactions" : "sqlite";
  const report = mode === "transactions"
    ? await runTransactionDemo()
    : await runSqliteDemo();
  console.log(JSON.stringify(report, null, 2));
  if (!["sqlite_adapter_ready", "sqlite_transactions_ready"].includes(report.status)) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(JSON.stringify({
      status: "failed",
      error: error.message,
      fallback: {
        safeMode: true,
        reason: "sqlite-transaction-demo-error"
      }
    }, null, 2));
    process.exitCode = 1;
  });
}

module.exports = {
  runSqliteDemo,
  runTransactionDemo
};
