const fs = require("node:fs");
const path = require("node:path");

class CodeQualityValidator {
  validate({ project, frontend, backend, database, api, router }) {
    const required = [
      "frontend/package.json",
      "frontend/src/App.jsx",
      "frontend/src/layouts/AppLayout.jsx",
      "frontend/src/routes/routes.js",
      "backend/package.json",
      "backend/src/server.js",
      "backend/src/routes/index.js",
      "database/schema/schema.sql",
      "database/entities.json",
      "docs/architecture.md"
    ];
    const checks = [
      ...required.map((file) => ({
        id: `file:${file}`,
        ok: fs.existsSync(path.join(project.projectRoot, file)),
        reason: "required generated artifact"
      })),
      { id: "frontend-components", ok: frontend.components.length >= 5, reason: "base components generated" },
      { id: "frontend-routes", ok: router.routes.length >= 4, reason: "navigation routes generated" },
      { id: "backend-controllers", ok: backend.controllers.length >= 5, reason: "controllers generated" },
      { id: "api-endpoints", ok: api.endpoints.length >= 5, reason: "base API endpoints generated" },
      { id: "database-entities", ok: database.entities.length >= 4, reason: "database entities generated" },
      { id: "no-install", ok: frontend.dependenciesInstalled === false && backend.dependenciesInstalled === false, reason: "dependencies were not installed" },
      { id: "readonly-safe", ok: frontend.readonly && backend.readonly && database.readonly, reason: "readonly-safe metadata present" }
    ].map((check) => ({ ...check, readonly: true }));
    const failures = checks.filter((check) => !check.ok);
    return {
      validationId: `code_quality_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      valid: failures.length === 0,
      checks,
      failures,
      readonly: true,
      deployExecuted: false,
      dependenciesInstalled: false,
      safetyMode: "readonly-safe-product-code-quality-validator"
    };
  }
}

module.exports = {
  CodeQualityValidator
};
