const fs = require("node:fs");
const path = require("node:path");

class SupervisorHealthScoreProvider {
  constructor({
    reportsDir = path.resolve(process.cwd(), "supervisor", "reports", "generated"),
    fallbackScore = 100
  } = {}) {
    this.reportsDir = reportsDir;
    this.fallbackScore = fallbackScore;
  }

  getLatestReportPath() {
    if (!fs.existsSync(this.reportsDir)) {
      return null;
    }

    const reports = fs
      .readdirSync(this.reportsDir)
      .filter((file) => file.startsWith("supervisor-report-") && file.endsWith(".json"))
      .map((file) => path.join(this.reportsDir, file))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

    return reports[0] || null;
  }

  loadLatestReport() {
    const reportPath = this.getLatestReportPath();
    if (!reportPath) {
      return null;
    }

    return JSON.parse(fs.readFileSync(reportPath, "utf8"));
  }

  getHealthScores(agentIds) {
    const report = this.loadLatestReport();
    const scores = Object.fromEntries(agentIds.map((agentId) => [agentId, this.fallbackScore]));

    if (!report?.agentHealth) {
      return scores;
    }

    for (const agent of report.agentHealth) {
      if (agent.agentId && Number.isFinite(agent.healthScore)) {
        scores[agent.agentId] = agent.healthScore;
      }
    }

    return scores;
  }
}

module.exports = {
  SupervisorHealthScoreProvider
};
