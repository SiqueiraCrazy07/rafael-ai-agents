const fs = require("node:fs");
const path = require("node:path");

function readJsonFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const fullPath = path.join(directory, file);
      return {
        path: fullPath,
        mtimeMs: fs.statSync(fullPath).mtimeMs,
        data: JSON.parse(fs.readFileSync(fullPath, "utf8"))
      };
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs);
}

class ForecastLoader {
  constructor(rootDir = process.cwd()) {
    this.rootDir = rootDir;
  }

  latest() {
    const forecasts = readJsonFiles(path.join(this.rootDir, "memory", "predictive"));
    return forecasts[0] || null;
  }
}

module.exports = {
  ForecastLoader
};
