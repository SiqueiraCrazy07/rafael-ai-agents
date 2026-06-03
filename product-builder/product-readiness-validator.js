const fs = require("node:fs");
const path = require("node:path");

class ProductReadinessValidator {
  validate({ folder, documentation, ux, curriculum, backlog, productDemo }) {
    const requiredFiles = [
      "README.md",
      "docs/architecture.md",
      "docs/roadmap.md",
      "docs/backlog.md",
      "docs/implementation-plan.md",
      "ux/ux-spec.md",
      "curriculum/curriculum.md",
      "assets/assets-plan.md",
      "tests/readiness-checklist.md",
      "frontend/prototype-demo.json"
    ];
    const checks = [
      ...requiredFiles.map((file) => ({
        id: `file:${file}`,
        ok: fs.existsSync(path.join(folder.projectRoot, file)),
        reason: "required project artifact"
      })),
      { id: "documentation", ok: documentation.files.length >= 8, reason: "documentation files generated" },
      { id: "ux", ok: ux.screens.length > 0 && ux.wireframes.length > 0, reason: "UX generated" },
      { id: "curriculum", ok: curriculum.generated || curriculum.reason === "non-educational-product", reason: "curriculum evaluated" },
      { id: "backlog", ok: backlog.epics.length > 0 && backlog.tasks.length > 0, reason: "backlog generated" },
      { id: "implementation-plan", ok: documentation.files.some((file) => file.endsWith("implementation-plan.md")), reason: "implementation plan generated" },
      { id: "demo", ok: Boolean(productDemo.demoPath), reason: "prototype demo generated" },
      { id: "readonly-safe", ok: productDemo.readonly && productDemo.deployExecuted === false, reason: "no deploy or destructive action" }
    ].map((check) => ({ ...check, readonly: true }));
    const failures = checks.filter((check) => !check.ok);
    return {
      readinessId: `product_readiness_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      ready: failures.length === 0,
      checks,
      failures,
      readiness: failures.length === 0 ? "product-builder-execution-runtime-v1-ready" : "product-builder-readiness-blocked",
      readonly: true,
      safetyMode: "readonly-safe-product-readiness-validator"
    };
  }
}

module.exports = {
  ProductReadinessValidator
};
