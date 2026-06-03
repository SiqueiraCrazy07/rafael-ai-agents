const fs = require("node:fs");
const path = require("node:path");

const PROJECT_FOLDERS = [
  "frontend",
  "backend",
  "database",
  "docs",
  "assets",
  "tests",
  "ux",
  "curriculum",
  "roadmap"
];

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
  return directory;
}

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "generated-product";
}

class ProductFolderGenerator {
  constructor({ rootDir = process.cwd() } = {}) {
    this.rootDir = rootDir;
    this.generatedRoot = path.join(rootDir, "projects", "generated");
  }

  createStructure(projectName) {
    const projectSlug = slugify(projectName);
    const projectRoot = path.join(this.generatedRoot, projectSlug);
    ensureDir(projectRoot);
    const folders = PROJECT_FOLDERS.map((folder) => ({
      name: folder,
      path: ensureDir(path.join(projectRoot, folder))
    }));
    return {
      projectSlug,
      projectRoot,
      folders,
      readonly: true,
      destructiveActions: false,
      safetyMode: "readonly-safe-product-folder-generator"
    };
  }
}

module.exports = {
  ProductFolderGenerator,
  PROJECT_FOLDERS,
  ensureDir,
  slugify
};
