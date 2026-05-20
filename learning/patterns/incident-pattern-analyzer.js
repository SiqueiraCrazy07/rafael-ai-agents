class IncidentPatternAnalyzer {
  analyze(memory) {
    const byWorkflow = new Map();
    const bySeverity = new Map();

    for (const item of memory.incidents) {
      const incident = item.data;
      byWorkflow.set(incident.workflow, (byWorkflow.get(incident.workflow) || 0) + 1);
      bySeverity.set(incident.severity, (bySeverity.get(incident.severity) || 0) + 1);
    }

    return {
      totalIncidents: memory.incidents.length,
      byWorkflow: Object.fromEntries(byWorkflow),
      bySeverity: Object.fromEntries(bySeverity),
      recurringWorkflows: [...byWorkflow.entries()]
        .filter(([, count]) => count > 1)
        .map(([workflow, count]) => ({ workflow, count }))
    };
  }
}

module.exports = {
  IncidentPatternAnalyzer
};
