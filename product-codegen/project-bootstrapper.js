const fs = require("node:fs");
const path = require("node:path");

const CODEGEN_DIRS = [
  "frontend/src/pages",
  "frontend/src/components",
  "frontend/src/layouts",
  "frontend/src/hooks",
  "frontend/src/services",
  "frontend/src/routes",
  "backend/src/controllers",
  "backend/src/services",
  "backend/src/repositories",
  "backend/src/middleware",
  "backend/src/validators",
  "backend/src/routes",
  "database/schema",
  "database/migrations",
  "database/seeds"
];

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
  return directory;
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${String(content).trim()}\n`, "utf8");
  return filePath;
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return null;
  }
}

class ProjectBootstrapper {
  constructor({ rootDir = process.cwd() } = {}) {
    this.rootDir = rootDir;
    this.generatedRoot = path.join(rootDir, "projects", "generated");
  }

  discoverProjects() {
    if (!fs.existsSync(this.generatedRoot)) {
      return [];
    }
    return fs.readdirSync(this.generatedRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => this.describeProject(path.join(this.generatedRoot, entry.name), entry.name));
  }

  describeProject(projectRoot, projectSlug) {
    const demo = readJson(path.join(projectRoot, "frontend", "prototype-demo.json")) || {};
    return {
      projectSlug,
      projectRoot,
      productName: demo.productName || projectSlug,
      category: demo.category || "business",
      screens: Array.isArray(demo.screens) ? demo.screens : ["home dashboard"],
      mvpFeatures: demo.sampleData?.mvpFeatures || [],
      curriculumGenerated: Boolean(demo.sampleData?.curriculumGenerated),
      readonly: true
    };
  }

  bootstrap(project) {
    const directories = CODEGEN_DIRS.map((dir) => ensureDir(path.join(project.projectRoot, dir)));
    return {
      projectSlug: project.projectSlug,
      projectRoot: project.projectRoot,
      directories,
      readonly: true,
      dependenciesInstalled: false,
      deployExecuted: false,
      safetyMode: "readonly-safe-product-codegen-bootstrapper"
    };
  }
}

module.exports = {
  ProjectBootstrapper,
  CODEGEN_DIRS,
  ensureDir,
  writeFile,
  readJson
};
