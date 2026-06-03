const path = require("node:path");
const { writeFile } = require("./project-bootstrapper");

class DatabaseGenerator {
  generate({ project, api }) {
    const entities = ["users", "progress", "content", "dashboard_events"];
    if (project.category === "crm") entities.push("contacts", "deals");
    if (project.category === "game") entities.push("missions", "scores");
    if (project.curriculumGenerated) entities.push("lessons", "mastery_states");
    const files = [];
    files.push(writeFile(path.join(project.projectRoot, "database", "schema", "schema.sql"), this.schemaSql(entities)));
    files.push(writeFile(path.join(project.projectRoot, "database", "migrations", "001_initial_plan.md"), this.migrationPlan(entities)));
    files.push(writeFile(path.join(project.projectRoot, "database", "seeds", "seed-plan.json"), JSON.stringify({
      productName: project.productName,
      entities,
      seedOnly: true,
      destructiveActions: false,
      readonly: true
    }, null, 2)));
    files.push(writeFile(path.join(project.projectRoot, "database", "entities.json"), JSON.stringify({
      entities,
      endpoints: api.endpoints.map((endpoint) => endpoint.path),
      readonly: true
    }, null, 2)));
    return {
      files,
      entities,
      migrationsPlan: ["001_initial_plan"],
      seedPlan: "seed-plan.json",
      readonly: true,
      destructiveActions: false,
      safetyMode: "readonly-safe-product-database-generator"
    };
  }

  schemaSql(entities) {
    return entities.map((entity) => `CREATE TABLE IF NOT EXISTS ${entity} (
  id TEXT PRIMARY KEY,
  payload JSON,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);`).join("\n\n");
  }

  migrationPlan(entities) {
    return `# Migration Plan

This is a readonly-safe migration plan. It is not executed automatically.

${entities.map((entity) => `- Create ${entity} table with JSON payload and audit timestamps.`).join("\n")}
`;
  }
}

module.exports = {
  DatabaseGenerator
};
