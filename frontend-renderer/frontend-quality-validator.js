const fs = require("node:fs");
const path = require("node:path");

class FrontendQualityValidator {
  validate(project, routes, generatedFiles) {
    const srcDir = path.join(project.projectRoot, "frontend", "src");
    const required = [
      "App.jsx",
      "styles.css",
      "routes/routes.js",
      "components/PrototypeShell.jsx",
      "components/GamifiedHud.jsx",
      "components/MetricCard.jsx",
      "pages/DashboardPage.jsx",
      "pages/LoginPage.jsx",
      "pages/ProgressPage.jsx",
      "pages/ContentPage.jsx"
    ];
    const routeChecks = routes.map((route) => `pages/${route.component}.jsx`);
    const checks = [
      {
        check: "required react files",
        status: required.every((file) => fs.existsSync(path.join(srcDir, file))) ? "passed" : "failed"
      },
      {
        check: "route page files",
        status: routeChecks.every((file) => fs.existsSync(path.join(srcDir, file))) ? "passed" : "failed"
      },
      {
        check: "functional navigation",
        status: fs.readFileSync(path.join(srcDir, "App.jsx"), "utf8").includes("window.location.hash") ? "passed" : "failed"
      },
      {
        check: "design tokens applied",
        status: fs.readFileSync(path.join(srcDir, "styles.css"), "utf8").includes("--color-primary") ? "passed" : "failed"
      },
      {
        check: "gamified components",
        status: fs.existsSync(path.join(srcDir, "components", "GamifiedHud.jsx")) ? "passed" : "failed"
      },
      {
        check: "readonly-safe marker",
        status: generatedFiles.some((file) => file.endsWith("frontend-renderer-manifest.json")) ? "passed" : "failed"
      }
    ];

    return {
      project: project.projectSlug,
      valid: checks.every((check) => check.status === "passed"),
      checks
    };
  }
}

module.exports = { FrontendQualityValidator };
