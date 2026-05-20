const fs = require("node:fs");
const path = require("node:path");

function readJsonLines(filePath) {
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

class RuntimeEventAnalyzer {
  constructor({ eventsDir = path.resolve(process.cwd(), "runtime-data", "events") } = {}) {
    this.eventsDir = eventsDir;
  }

  loadEvents() {
    if (!fs.existsSync(this.eventsDir)) {
      return [];
    }

    return fs
      .readdirSync(this.eventsDir)
      .filter((file) => file.endsWith(".jsonl"))
      .flatMap((file) => readJsonLines(path.join(this.eventsDir, file)));
  }

  analyze(events = this.loadEvents()) {
    const byExecution = new Map();
    const byWorkflow = new Map();

    for (const event of events) {
      if (!byExecution.has(event.executionId)) {
        byExecution.set(event.executionId, []);
      }
      byExecution.get(event.executionId).push(event);

      if (!byWorkflow.has(event.workflow)) {
        byWorkflow.set(event.workflow, []);
      }
      byWorkflow.get(event.workflow).push(event);
    }

    const failures = events.filter(
      (event) =>
        event.type === "execution_failed" ||
        event.type === "rollback_triggered" ||
        event.nextStatus === "failed"
    );
    const retries = events.filter((event) => event.type === "retry_started");
    const rollbacks = events.filter((event) => event.type === "rollback_triggered");
    const completed = events.filter((event) => event.type === "execution_completed");

    return {
      events,
      byExecution,
      byWorkflow,
      summary: {
        totalEvents: events.length,
        executions: byExecution.size,
        workflows: byWorkflow.size,
        failures: failures.length,
        retries: retries.length,
        rollbacks: rollbacks.length,
        completed: completed.length
      },
      failures,
      retries,
      rollbacks,
      completed
    };
  }
}

module.exports = {
  RuntimeEventAnalyzer
};
