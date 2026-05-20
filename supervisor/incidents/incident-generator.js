class IncidentGenerator {
  generate({ failurePatterns, retryPatterns }) {
    const incidents = [];
    const seen = new Set();

    function addIncident(key, incident) {
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      incidents.push(incident);
    }

    for (const pattern of failurePatterns) {
      addIncident(`${pattern.executionId}:${pattern.severity}`, {
        incidentId: `incident_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        createdAt: new Date().toISOString(),
        severity: pattern.severity,
        status: "open",
        project: pattern.project,
        workflow: pattern.workflow,
        executionId: pattern.executionId,
        title: `Supervisor detected ${pattern.type}`,
        impact: pattern.severity === "high" ? "Operational recovery required" : "Workflow degraded",
        evidence: [pattern.evidence],
        requiredResponse:
          pattern.severity === "high"
            ? "Review rollback/recovery and validate before next execution"
            : "Inspect logs and monitor recurrence",
        humanRequired: ["high", "critical"].includes(pattern.severity)
      });
    }

    for (const retry of retryPatterns.filter((item) => item.exhausted || item.risky)) {
      addIncident(`${retry.executionId}:${retry.exhausted ? "high" : "medium"}`, {
        incidentId: `incident_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        createdAt: new Date().toISOString(),
        severity: retry.exhausted ? "high" : "medium",
        status: "open",
        project: retry.project,
        workflow: retry.workflow,
        executionId: retry.executionId,
        title: "Supervisor detected risky retry pattern",
        impact: retry.exhausted ? "Retry limit exhausted" : "Retry budget nearly exhausted",
        evidence: [`retries=${retry.retries}/${retry.maxRetries}`],
        requiredResponse: retry.exhausted
          ? "Block automatic retry and request human review"
          : "Monitor workflow and validate output",
        humanRequired: retry.exhausted
      });
    }

    return incidents;
  }
}

module.exports = {
  IncidentGenerator
};
